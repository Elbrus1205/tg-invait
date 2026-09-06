import type { ServiceStatus } from "@/types/dashboard";

const statusCopy: Record<ServiceStatus, { label: string; className: string }> = {
  operational: {
    label: "Operational",
    className: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  },
  degraded: {
    label: "Degraded",
    className: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  },
  offline: {
    label: "Not connected",
    className: "border-slate-500/40 bg-slate-500/10 text-slate-300",
  },
};

export function StatusPill({ status }: { status: ServiceStatus }) {
  const copy = statusCopy[status];

  return (
    <span
      className={`inline-flex min-h-7 items-center gap-2 rounded-full border px-2.5 text-xs font-medium ${copy.className}`}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      <span>{copy.label}</span>
    </span>
  );
}
