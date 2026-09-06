import type {
  HealthCheck,
  HealthReport,
  WorkerCommandEnvelope,
  WorkerCommandType,
  WorkerHeartbeat,
  WorkerLifecycle
} from "@invait/contracts";
import type { CommandRouter } from "../workers/command-router.js";
import type { AccountLockPort } from "../workers/account-lock.js";
import type { AccountStatePort } from "../workers/account-lifecycle.js";
import type { TelegramGateway } from "../telegram/index.js";
import type { TaskExecutorPort, TaskStatePort } from "../workers/tasks.js";
import type { PrismaClient } from "@prisma/client";

export type WorkerCommandHandler = (
  command: WorkerCommandEnvelope
) => Promise<unknown> | unknown;

export interface WorkerCommandRouteResult {
  readonly commandId: string;
  readonly type: WorkerCommandType | string;
  readonly status: "completed" | "deferred" | "rejected";
  readonly result?: unknown;
  readonly reason?: string;
}

export interface WorkerCommandConsumer {
  consume(handler: WorkerCommandHandler): Promise<WorkerCommandSubscription>;
}

export interface WorkerCommandSubscription {
  close(): Promise<void> | void;
}

export interface WorkerHealthProbe {
  readonly name: string;
  check(): Promise<HealthCheck> | HealthCheck;
}

export interface WorkerClock {
  now(): Date;
}

export interface WorkerSnapshot {
  readonly workerId: string;
  readonly lifecycle: WorkerLifecycle;
  readonly activeAccounts: number;
  readonly activeJobs: number;
  readonly emittedAt: string;
}

export interface TelegramWorkerOptions {
  readonly workerId: string;
  readonly heartbeatPort: {
    publish(heartbeat: WorkerHeartbeat): Promise<void>;
  };
  readonly commandConsumer?: WorkerCommandConsumer;
  readonly commandRouter?: CommandRouter;
  readonly healthProbes?: readonly WorkerHealthProbe[];
  readonly heartbeatIntervalMs?: number;
  readonly clock?: WorkerClock;
  readonly version?: string;
  readonly telegramGateway?: TelegramGateway;
  readonly prisma?: PrismaClient;
  readonly accountLock?: AccountLockPort;
  readonly accountState?: AccountStatePort;
  readonly accountLockTtlMs?: number;
  readonly taskState?: TaskStatePort;
  readonly taskExecutor?: TaskExecutorPort;
}

export type WorkerHealthReport = HealthReport;
