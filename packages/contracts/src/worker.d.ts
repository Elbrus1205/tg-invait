export type WorkerLifecycle = "starting" | "ready" | "draining" | "offline";
export interface WorkerHeartbeat {
    readonly workerId: string;
    readonly lifecycle: WorkerLifecycle;
    readonly activeAccounts: number;
    readonly activeJobs: number;
    readonly emittedAt: string;
}
export interface WorkerHeartbeatPort {
    publish(heartbeat: WorkerHeartbeat): Promise<void>;
}
//# sourceMappingURL=worker.d.ts.map