import type { HealthReport, HealthState } from "@invait/contracts";

/** A dependency check supplied by an adapter at the composition root. */
export interface ReadinessCheck {
  readonly name: string;
  readonly check: () => boolean | Promise<boolean>;
}

export interface HealthServerResponse extends HealthReport {
  /** The process is alive even when a dependency is unavailable. */
  readonly live: boolean;
  /** Readiness is kept explicit for load balancers and smoke tests. */
  readonly ready: boolean;
  /** A conventional alias for clients that expect `status`. */
  readonly status: HealthState;
  readonly service: "backend";
}

export interface HealthServiceOptions {
  readonly checks?: readonly ReadinessCheck[];
  readonly checkTimeoutMs?: number;
  readonly version?: string;
  readonly now?: () => Date;
}
