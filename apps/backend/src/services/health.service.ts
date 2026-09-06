import type { HealthCheck, HealthState } from "@invait/contracts";

import type {
  HealthServerResponse,
  HealthServiceOptions,
  ReadinessCheck
} from "../types/health.js";

interface CheckOutcome {
  readonly state: HealthState;
  readonly detail?: string;
  readonly checkedAt: string;
}

const DEFAULT_CHECK: ReadinessCheck = {
  name: "process",
  check: () => true
};

function normalizeChecks(checks: readonly ReadinessCheck[] | undefined): readonly ReadinessCheck[] {
  const configured = checks && checks.length > 0 ? checks : [DEFAULT_CHECK];
  const names = new Set<string>();

  for (const check of configured) {
    const name = check.name.trim();
    if (name.length === 0) {
      throw new TypeError("Health check names must not be empty");
    }
    if (names.has(name)) {
      throw new TypeError(`Duplicate health check: ${name}`);
    }
    names.add(name);
  }

  return configured.map((check) => ({
    name: check.name.trim(),
    check: check.check
  }));
}

function asIsoDate(now: () => Date): string {
  const value = now();
  return Number.isNaN(value.getTime()) ? new Date(0).toISOString() : value.toISOString();
}

/**
 * Dependency-free health/readiness service.
 *
 * The default check is process-only. Database, Redis, and worker checks can be
 * injected later without changing the HTTP route contract.
 */
export class HealthService {
  private readonly checks: readonly ReadinessCheck[];
  private readonly checkTimeoutMs: number;
  private readonly version: string;
  private readonly now: () => Date;

  public constructor(options: HealthServiceOptions = {}) {
    this.checks = normalizeChecks(options.checks);
    this.checkTimeoutMs = options.checkTimeoutMs !== undefined && options.checkTimeoutMs > 0
      ? Math.min(options.checkTimeoutMs, 30_000)
      : 1_000;
    this.version = options.version?.trim() || "0.1.0";
    this.now = options.now ?? (() => new Date());
  }

  public getLiveness(): HealthServerResponse {
    const checkedAt = asIsoDate(this.now);
    const check: HealthCheck = {
      name: "process",
      state: "ok",
      checkedAt
    };

    return {
      state: "ok",
      status: "ok",
      version: this.version,
      checks: [check],
      checkedAt,
      live: true,
      ready: true,
      service: "backend"
    };
  }

  public async getReadiness(): Promise<HealthServerResponse> {
    const checks = await Promise.all(this.checks.map((check) => this.runCheck(check)));
    const ready = checks.every((check) => check.state === "ok");
    const state: HealthState = ready ? "ok" : "down";
    const checkedAt = asIsoDate(this.now);

    return {
      state,
      status: state,
      version: this.version,
      checks,
      checkedAt,
      live: true,
      ready,
      service: "backend"
    };
  }

  public async getHealth(): Promise<HealthServerResponse> {
    return this.getReadiness();
  }

  private async runCheck(check: ReadinessCheck): Promise<HealthCheck> {
    const checkedAt = asIsoDate(this.now);
    const checkPromise = Promise.resolve()
      .then(() => check.check())
      .then((passed): CheckOutcome => {
        if (passed) {
          return { state: "ok", checkedAt };
        }
        return { state: "down", detail: "unavailable", checkedAt };
      })
      .catch((): CheckOutcome => ({
        state: "down",
        detail: "unavailable",
        checkedAt
      }));

    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<CheckOutcome>((resolve) => {
      timeoutHandle = setTimeout(
        () => resolve({ state: "down", detail: "timeout", checkedAt }),
        this.checkTimeoutMs
      );
    });

    try {
      const outcome = await Promise.race([checkPromise, timeout]);
      return {
        name: check.name,
        state: outcome.state,
        checkedAt: outcome.checkedAt,
        ...(outcome.detail === undefined ? {} : { detail: outcome.detail })
      };
    } finally {
      if (timeoutHandle !== undefined) {
        clearTimeout(timeoutHandle);
      }
    }
  }
}
