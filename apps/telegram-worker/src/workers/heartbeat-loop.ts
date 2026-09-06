import type { WorkerHeartbeat, WorkerHeartbeatPort } from "@invait/contracts";
import type { WorkerClock, WorkerSnapshot } from "../types/index.js";
import { systemClock } from "../utils/clock.js";

export interface HeartbeatLoopOptions {
  readonly heartbeatPort: WorkerHeartbeatPort;
  readonly intervalMs: number;
  readonly clock?: WorkerClock;
  readonly snapshot: () => WorkerSnapshot;
  readonly onPublishError?: (error: unknown) => void;
}

/** A small timer that publishes snapshots without exposing timer internals. */
export class HeartbeatLoop {
  private readonly clock: WorkerClock;
  private timer: ReturnType<typeof setInterval> | undefined;
  private inFlight: Promise<void> | undefined;

  public constructor(private readonly options: HeartbeatLoopOptions) {
    this.clock = options.clock ?? systemClock;
  }

  public get running(): boolean {
    return typeof this.timer !== "undefined";
  }

  public start(): void {
    if (this.timer) {
      return;
    }

    this.timer = setInterval(() => {
      void this.tick();
    }, this.options.intervalMs);
  }

  public stop(): void {
    if (!this.timer) {
      return;
    }

    clearInterval(this.timer);
    this.timer = undefined;
  }

  public async tick(): Promise<void> {
    if (this.inFlight) {
      return this.inFlight;
    }

    const snapshot = this.options.snapshot();
    const heartbeat: WorkerHeartbeat = {
      workerId: snapshot.workerId,
      lifecycle: snapshot.lifecycle,
      activeAccounts: snapshot.activeAccounts,
      activeJobs: snapshot.activeJobs,
      emittedAt: this.clock.now().toISOString()
    };

    const publish = (async () => {
      try {
        await this.options.heartbeatPort.publish(heartbeat);
      } catch (error) {
        this.options.onPublishError?.(error);
      }
    })();

    this.inFlight = publish;
    try {
      await publish;
    } finally {
      this.inFlight = undefined;
    }
  }
}
