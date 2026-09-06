import type { WorkerHeartbeat, WorkerHeartbeatPort } from "@invait/contracts";

import { assertWorkerHeartbeat } from "./worker-heartbeat.js";

/** In-process heartbeat registry for tests; Redis publishing is a later adapter. */
export class InMemoryWorkerHeartbeatRegistry implements WorkerHeartbeatPort {
  private readonly heartbeats = new Map<string, WorkerHeartbeat>();

  public async publish(heartbeat: WorkerHeartbeat): Promise<void> {
    assertWorkerHeartbeat(heartbeat);
    this.heartbeats.set(heartbeat.workerId, heartbeat);
  }

  public get(workerId: string): WorkerHeartbeat | undefined {
    return this.heartbeats.get(workerId);
  }

  public list(): readonly WorkerHeartbeat[] {
    return [...this.heartbeats.values()];
  }

  public clear(): void {
    this.heartbeats.clear();
  }
}
