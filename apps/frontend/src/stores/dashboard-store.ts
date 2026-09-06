import type { ServiceHealth } from "@/types/dashboard";

/**
 * The state contract is intentionally framework-agnostic for Stage 1.
 * A future realtime store can hydrate this shape from the backend/WebSocket.
 */
export interface DashboardStoreSnapshot {
  lastUpdated: string | null;
  services: readonly ServiceHealth[];
}

export const emptyDashboardStore: DashboardStoreSnapshot = {
  lastUpdated: null,
  services: [],
};
