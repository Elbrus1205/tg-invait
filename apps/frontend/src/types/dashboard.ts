export type MetricTone = "default" | "positive" | "warning" | "danger" | "info";

export type ServiceStatus = "operational" | "degraded" | "offline";

export interface DashboardMetric {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: MetricTone;
  icon: "users" | "activity" | "server" | "database";
}

export interface DashboardEvent {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  tone: MetricTone;
}

export interface ServiceHealth {
  id: string;
  name: string;
  description: string;
  status: ServiceStatus;
  latency?: string;
}
