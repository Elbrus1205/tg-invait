"use client";

import { useEffect, useState } from "react";
import { createApiClient } from "@/services/api-client";

interface AuditItem { readonly id: string; readonly action: string; readonly entity: string; readonly entityId: string | null; readonly actorId: string | null; readonly createdAt: string; }

export default function AuditPage() {
  const [items, setItems] = useState<readonly AuditItem[]>([]); const [status, setStatus] = useState("");
  useEffect(() => { const base = process.env.NEXT_PUBLIC_API_URL; if (!base || typeof window === "undefined") return; const source = new EventSource(new URL("/api/events", base)); source.addEventListener("audit", () => setStatus("Realtime audit event received")); source.onerror = () => source.close(); return () => source.close(); }, []);
  async function load() { try { const result = await createApiClient().get<{ readonly items: readonly AuditItem[] }>("/api/audit"); setItems(result.items); setStatus(`${result.items.length} audit records`); } catch (error) { setStatus(error instanceof Error ? error.message : "Failed to load audit logs"); } }
  return <div className="space-y-6"><div><p className="eyebrow">Security / Audit</p><h1 className="mt-2 text-3xl font-semibold text-white">Audit Logs</h1><p className="mt-3 text-sm text-slate-400">Immutable record of administrative mutations. Sensitive values are redacted.</p></div><section className="surface-card p-6"><button type="button" onClick={() => void load()} className="min-h-11 rounded-lg bg-emerald-300 px-4 text-sm font-semibold text-slate-950">Load audit logs</button>{status ? <p role="status" className="mt-3 text-sm text-slate-400">{status}</p> : null}</section><section className="surface-card divide-y divide-slate-800">{items.map((item) => <article key={item.id} className="grid gap-2 p-4 md:grid-cols-[150px_1fr_auto]"><span className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</span><p className="text-sm text-slate-200">{item.action} · {item.entity}<span className="ml-2 text-xs text-slate-500">{item.entityId ?? ""}</span></p><span className="text-xs text-slate-500">{item.actorId ?? "system"}</span></article>)}{items.length === 0 ? <p className="p-6 text-sm text-slate-500">No audit records loaded.</p> : null}</section></div>;
}
