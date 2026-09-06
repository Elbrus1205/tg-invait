export type HealthState = "ok" | "degraded" | "down";
export interface HealthCheck {
    readonly name: string;
    readonly state: HealthState;
    readonly detail?: string;
    readonly checkedAt: string;
}
export interface HealthReport {
    readonly state: HealthState;
    readonly version: string;
    readonly checks: readonly HealthCheck[];
    readonly checkedAt: string;
}
//# sourceMappingURL=health.d.ts.map