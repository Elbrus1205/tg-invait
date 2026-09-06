import type {
  HealthCheck,
  HealthReport,
  HealthState,
  WorkerLifecycle
} from "@invait/contracts";
import { CommandRouter } from "./command-router.js";
import { createAccountLifecycleHandlers } from "./account-lifecycle.js";
import { createDialogHandlers } from "./dialogs.js";
import { createMessageHandlers } from "./messages.js";
import { createContactHandlers } from "./contacts.js";
import { createInvitationHandlers, createPrismaInvitationHandlers } from "./invitations.js";
import { createTaskHandlers } from "./tasks.js";
import { HeartbeatLoop } from "./heartbeat-loop.js";
import type {
  TelegramWorkerOptions,
  WorkerCommandRouteResult,
  WorkerClock,
  WorkerHealthProbe,
  WorkerSnapshot
} from "../types/index.js";
import { systemClock } from "../utils/clock.js";

const defaultHeartbeatIntervalMs = 15_000;

function healthRank(state: HealthState): number {
  switch (state) {
    case "down":
      return 2;
    case "degraded":
      return 1;
    case "ok":
      return 0;
  }
}

function worstHealthState(checks: readonly HealthCheck[]): HealthState {
  const worst = checks.reduce<HealthState>(
    (current, check) =>
      healthRank(check.state) > healthRank(current) ? check.state : current,
    "ok"
  );
  return worst;
}

function safeErrorDetail(error: unknown): string {
  if (error instanceof Error && error.name) {
    return error.name;
  }
  return "publish_failed";
}

/**
 * Process composition root for the isolated Telegram worker.
 *
 * Queue, heartbeat, and Telegram integrations are ports. Stage 1 only wires
 * the process lifecycle and intentionally leaves Telegram handlers deferred.
 */
export class TelegramWorker {
  private readonly router: CommandRouter;
  private readonly probes: readonly WorkerHealthProbe[];
  private readonly clock: WorkerClock;
  private readonly version: string;
  private readonly heartbeatLoop: HeartbeatLoop;
  private lifecycle: WorkerLifecycle = "offline";
  private activeAccounts = 0;
  private activeJobs = 0;
  private subscription: { close(): Promise<void> | void } | undefined;
  private heartbeatPublishError: string | undefined;
  private started = false;

  public constructor(private readonly options: TelegramWorkerOptions) {
    this.router = options.commandRouter ?? new CommandRouter(
      options.telegramGateway && options.accountLock && options.accountState
        ? {
            ...createAccountLifecycleHandlers({
            workerId: options.workerId,
            gateway: options.telegramGateway,
            lock: options.accountLock,
            state: options.accountState,
            ...(options.accountLockTtlMs === undefined ? {} : { lockTtlMs: options.accountLockTtlMs })
            }),
            ...createDialogHandlers({
              workerId: options.workerId,
              gateway: options.telegramGateway,
              lock: options.accountLock,
              ...(options.accountLockTtlMs === undefined ? {} : { lockTtlMs: options.accountLockTtlMs })
            }),
            ...createMessageHandlers({
              workerId: options.workerId,
              gateway: options.telegramGateway,
              lock: options.accountLock,
              ...(options.accountLockTtlMs === undefined ? {} : { lockTtlMs: options.accountLockTtlMs })
            }),
            ...createContactHandlers({
              workerId: options.workerId,
              gateway: options.telegramGateway,
              lock: options.accountLock,
              ...(options.accountLockTtlMs === undefined ? {} : { lockTtlMs: options.accountLockTtlMs })
            }),
            ...(options.prisma ? createPrismaInvitationHandlers({ prisma: options.prisma, workerId: options.workerId, gateway: options.telegramGateway, lock: options.accountLock, ...(options.accountLockTtlMs === undefined ? {} : { lockTtlMs: options.accountLockTtlMs }) }) : createInvitationHandlers({
              workerId: options.workerId,
              gateway: options.telegramGateway,
              lock: options.accountLock,
              ...(options.accountLockTtlMs === undefined ? {} : { lockTtlMs: options.accountLockTtlMs })
            }))
          }
        : options.taskState && options.taskExecutor
          ? createTaskHandlers({ state: options.taskState, executor: options.taskExecutor })
          : {}
    );
    if (options.taskState && options.taskExecutor && !this.router.has("PROCESS_TASK")) this.router.register("PROCESS_TASK", createTaskHandlers({ state: options.taskState, executor: options.taskExecutor }).PROCESS_TASK);
    this.probes = options.healthProbes ?? [];
    this.clock = options.clock ?? systemClock;
    this.version = options.version ?? "0.1.0";
    this.heartbeatLoop = new HeartbeatLoop({
      heartbeatPort: options.heartbeatPort,
      intervalMs: options.heartbeatIntervalMs ?? defaultHeartbeatIntervalMs,
      clock: this.clock,
      snapshot: () => this.snapshot(),
      onPublishError: (error) => {
        this.heartbeatPublishError = safeErrorDetail(error);
      }
    });
  }

  public get workerId(): string {
    return this.options.workerId;
  }

  public get isRunning(): boolean {
    return this.started;
  }

  public snapshot(): WorkerSnapshot {
    return {
      workerId: this.options.workerId,
      lifecycle: this.lifecycle,
      activeAccounts: this.activeAccounts,
      activeJobs: this.activeJobs,
      emittedAt: this.clock.now().toISOString()
    };
  }

  public async start(): Promise<void> {
    if (this.started) {
      return;
    }

    this.started = true;
    this.setLifecycle("starting");
    await this.heartbeatLoop.tick();

    try {
      if (this.options.commandConsumer) {
        this.subscription = await this.options.commandConsumer.consume((command) =>
          this.processCommand(command)
        );
      }
      this.setLifecycle("ready");
      this.heartbeatLoop.start();
      await this.heartbeatLoop.tick();
    } catch (error) {
      this.started = false;
      this.setLifecycle("offline");
      await this.heartbeatLoop.tick();
      throw error;
    }
  }

  public async stop(): Promise<void> {
    if (!this.started) {
      return;
    }

    this.setLifecycle("draining");
    this.heartbeatLoop.stop();
    await this.heartbeatLoop.tick();

    const subscription = this.subscription;
    this.subscription = undefined;
    if (subscription) {
      await subscription.close();
    }

    this.started = false;
    this.setLifecycle("offline");
    await this.heartbeatLoop.tick();
  }

  public async processCommand(
    command: Parameters<CommandRouter["dispatch"]>[0]
  ): Promise<WorkerCommandRouteResult> {
    if (!this.started || this.lifecycle !== "ready") {
      return {
        commandId: command.id,
        type: command.type,
        status: "deferred",
        reason: "worker_not_ready"
      };
    }

    this.activeJobs += 1;
    try {
      return await this.router.dispatch(command);
    } catch {
      return {
        commandId: command.id,
        type: command.type,
        status: "rejected",
        reason: "handler_failed"
      };
    } finally {
      this.activeJobs -= 1;
    }
  }

  public async health(): Promise<HealthReport> {
    const checkedAt = this.clock.now().toISOString();
    const checks: HealthCheck[] = [
      {
        name: "worker",
        state: this.lifecycle === "ready" ? "ok" : this.lifecycle === "offline" ? "down" : "degraded",
        detail: `lifecycle:${this.lifecycle}`,
        checkedAt
      }
    ];

    if (this.heartbeatPublishError) {
      checks.push({
        name: "heartbeat",
        state: "degraded",
        detail: this.heartbeatPublishError,
        checkedAt
      });
    } else {
      checks.push({ name: "heartbeat", state: "ok", checkedAt });
    }

    for (const probe of this.probes) {
      try {
        checks.push(await probe.check());
      } catch (error) {
        checks.push({
          name: probe.name,
          state: "down",
          detail: safeErrorDetail(error),
          checkedAt
        });
      }
    }

    return {
      state: worstHealthState(checks),
      version: this.version,
      checks,
      checkedAt
    };
  }

  public getHealth(): Promise<HealthReport> {
    return this.health();
  }

  private setLifecycle(lifecycle: WorkerLifecycle): void {
    this.lifecycle = lifecycle;
  }
}

export function createTelegramWorker(options: TelegramWorkerOptions): TelegramWorker {
  return new TelegramWorker(options);
}
