"use client";

import { useState } from "react";
import { createApiClient } from "@/services/api-client";

interface UserItem { readonly id: string; readonly email: string; readonly name: string | null; readonly roles: readonly string[]; readonly createdAt: string; }

export default function AdminPage() {
  const [users, setUsers] = useState<readonly UserItem[]>([]); const [status, setStatus] = useState("");
  async function load() { try { const result = await createApiClient().get<{ readonly items: readonly UserItem[] }>("/api/users"); setUsers(result.items); setStatus(`${result.items.length} users`); } catch (error) { setStatus(error instanceof Error ? error.message : "Failed to load users"); } }
  return <div className="space-y-6"><div><p className="eyebrow">Administration</p><h1 className="mt-2 text-3xl font-semibold text-white">Admin Panel</h1><p className="mt-3 text-sm text-slate-400">Users and roles overview. Mutations are protected by backend RBAC.</p></div><section className="surface-card p-6"><button type="button" onClick={() => void load()} className="min-h-11 rounded-lg bg-emerald-300 px-4 text-sm font-semibold text-slate-950">Load users</button>{status ? <p role="status" className="mt-3 text-sm text-slate-400">{status}</p> : null}</section><section className="surface-card divide-y divide-slate-800">{users.map((item) => <article key={item.id} className="grid gap-2 p-4 md:grid-cols-[1fr_1fr_auto]"><div><p className="text-sm font-medium text-slate-200">{item.name ?? "Unnamed"}</p><p className="text-xs text-slate-500">{item.email}</p></div><p className="text-sm text-slate-300">{item.roles.join(", ")}</p><time className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</time></article>)}{users.length === 0 ? <p className="p-6 text-sm text-slate-500">No users loaded.</p> : null}</section></div>;
}
