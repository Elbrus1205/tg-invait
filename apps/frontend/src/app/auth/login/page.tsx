"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createApiClient } from "@/services/api-client";

interface AuthResponse { readonly accessToken: string; readonly refreshToken: string; }

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true); setError(undefined);
    try {
      const result = await createApiClient().post<AuthResponse>("/api/auth/login", { email: String(form.get("email") ?? ""), password: String(form.get("password") ?? "") });
      localStorage.setItem("invait.accessToken", result.accessToken);
      localStorage.setItem("invait.refreshToken", result.refreshToken);
      router.push("/accounts");
    } catch { setError("Неверный email или пароль."); }
    finally { setBusy(false); }
  }

  return <div className="mx-auto max-w-lg space-y-6"><div><p className="eyebrow">Invait / account</p><h1 className="mt-2 text-3xl font-semibold text-white">Вход</h1><p className="mt-3 text-sm leading-6 text-slate-400">Войдите, чтобы управлять собственными Telegram-аккаунтами и задачами.</p></div><form onSubmit={submit} className="surface-card space-y-4 p-6"><label className="block text-sm text-slate-300">Email<input name="email" type="email" required autoComplete="email" className="mt-2 min-h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-white" /></label><label className="block text-sm text-slate-300">Пароль<input name="password" type="password" required autoComplete="current-password" className="mt-2 min-h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-white" /></label><button disabled={busy} className="min-h-11 rounded-lg bg-emerald-300 px-4 text-sm font-semibold text-slate-950 disabled:opacity-50">{busy ? "Вход…" : "Войти"}</button>{error ? <p role="alert" className="text-sm text-rose-300">{error}</p> : null}</form><p className="text-sm text-slate-400">Нет аккаунта? <Link className="text-emerald-300" href="/auth/register">Зарегистрироваться</Link></p></div>;
}
