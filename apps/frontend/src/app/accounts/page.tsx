"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createApiClient } from "@/services/api-client";

interface Account { readonly id: string; readonly username: string | null; readonly phone: string | null; readonly firstName: string | null; readonly lastName: string | null; readonly status: string; readonly sessionStatus: string; }

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<readonly Account[]>([]);
  const [state, setState] = useState("Загрузка…");

  useEffect(() => { let active = true; createApiClient().get<{ readonly items: readonly Account[] }>("/api/accounts").then((result) => { if (active) { setAccounts(result.items); setState(""); } }).catch(() => { if (active) setState("Войдите в аккаунт, чтобы увидеть Telegram-аккаунты."); }); return () => { active = false; }; }, []);

  return <div className="space-y-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">Telegram accounts</p><h1 className="mt-2 text-3xl font-semibold text-white">Ваши аккаунты</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Подключайте только аккаунты, которыми вы владеете или управляете с разрешения. Сессии обрабатываются worker и хранятся зашифрованными.</p></div><Link href="/accounts/import-tdata" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-300 px-4 text-sm font-semibold text-slate-950">Импортировать TData</Link></div><section className="surface-card p-6"><h2 className="text-lg font-semibold text-white">Подключение Telegram</h2><p className="mt-2 text-sm leading-6 text-slate-400">Загрузите ZIP-архив TData, чтобы поставить подключение в очередь. Автоматическое создание ботов через BotFather не выполняется: для Bot API нужен отдельный токен, который нельзя публиковать в коде или логах.</p></section>{state ? <p className="text-sm text-slate-400">{state}</p> : accounts.length === 0 ? <section className="surface-card p-8"><h2 className="text-lg font-semibold text-white">Аккаунтов пока нет</h2><p className="mt-2 text-sm text-slate-400">Начните с импорта TData.</p><Link href="/accounts/import-tdata" className="mt-5 inline-flex min-h-11 items-center rounded-lg border border-emerald-300/50 px-4 text-sm text-emerald-200">Открыть импорт</Link></section> : <div className="grid gap-4 md:grid-cols-2">{accounts.map((account) => <article key={account.id} className="surface-card p-5"><div className="flex items-start justify-between gap-4"><div><h2 className="font-medium text-white">{account.username ? `@${account.username}` : account.firstName || "Telegram account"}</h2><p className="mt-1 text-xs text-slate-500">{account.phone ?? "Телефон скрыт"}</p></div><span className="rounded-full border border-slate-700 px-2 py-1 text-xs text-slate-300">{account.status}</span></div><p className="mt-4 text-xs text-slate-500">Session: {account.sessionStatus}</p></article>)}</div>}</div>;
}
