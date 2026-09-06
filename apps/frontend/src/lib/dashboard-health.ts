import type { ServiceStatus } from "@/types/dashboard";

export interface HealthSummary {
  healthy: number;
  total: number;
  percentage: number;
}

/** Summarise service health without exposing implementation details to views. */
export function getHealthSummary(
  statuses: readonly ServiceStatus[],
): HealthSummary {
  const total = statuses.length;
  const healthy = statuses.filter((status) => status === "operational").length;

  return {
    healthy,
    total,
    percentage: total === 0 ? 0 : Math.round((healthy / total) * 100),
  };
}
