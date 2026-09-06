import {
  Activity,
  Database,
  ServerCog,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { DashboardMetric } from "@/types/dashboard";

const icons: Record<DashboardMetric["icon"], LucideIcon> = {
  users: Users,
  activity: Activity,
  server: ServerCog,
  database: Database,
};

const tones: Record<DashboardMetric["tone"], string> = {
  default: "text-slate-200",
  positive: "text-emerald-300",
  warning: "text-amber-200",
  danger: "text-rose-300",
  info: "text-sky-300",
};

export function MetricCard({ metric }: { metric: DashboardMetric }) {
  const Icon = icons[metric.icon];

  return (
    <article className="surface-card group p-5 transition duration-200 hover:-translate-y-0.5 hover:border-slate-600 hover:shadow-glow">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-400">{metric.label}</p>
          <p className={`mt-3 font-mono text-3xl font-semibold tracking-tight ${tones[metric.tone]}`}>
            {metric.value}
          </p>
        </div>
        <span className="rounded-xl border border-slate-700 bg-slate-900/80 p-2.5 text-slate-300" aria-hidden="true">
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </span>
      </div>
      <p className="mt-4 text-xs leading-5 text-slate-500">{metric.detail}</p>
    </article>
  );
}
