import type { WorkerHeartbeat, WorkerHeartbeatPort } from "@invait/contracts";

export type { WorkerHeartbeat, WorkerHeartbeatPort, WorkerLifecycle } from "@invait/contracts";

export function assertWorkerHeartbeat(heartbeat: WorkerHeartbeat): void {
  if (heartbeat.workerId.trim().length === 0 || heartbeat.workerId.length > 128) {
    throw new TypeError("Worker id must be between 1 and 128 characters");
  }
  if (!Number.isInteger(heartbeat.activeAccounts) || heartbeat.activeAccounts < 0) {
    throw new TypeError("activeAccounts must be a non-negative integer");
  }
  if (!Number.isInteger(heartbeat.activeJobs) || heartbeat.activeJobs < 0) {
    throw new TypeError("activeJobs must be a non-negative integer");
  }
  if (Number.isNaN(Date.parse(heartbeat.emittedAt))) {
    throw new TypeError("Heartbeat emittedAt must be an ISO-compatible date");
  }
}

export type BackendWorkerHeartbeatPort = WorkerHeartbeatPort;
