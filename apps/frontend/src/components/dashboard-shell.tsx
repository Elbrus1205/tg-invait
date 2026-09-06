"use client";

import {
  Activity,
  Bell,
  Boxes,
  MessagesSquare,
  ContactRound,
  Send,
  ChevronRight,
  LayoutDashboard,
  Menu,
  Network,
  Settings,
  ShieldCheck,
  X,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { useDisclosure } from "@/hooks/use-disclosure";

const navigation = [
  { label: "Обзор", href: "/", icon: LayoutDashboard },
  { label: "Telegram accounts", href: "/accounts", icon: Boxes },
  { label: "Chats", href: "/chats", icon: MessagesSquare },
  { label: "Contacts", href: "/contacts", icon: ContactRound },
  { label: "Invitations", href: "/invitations", icon: Send },
  { label: "Proxies", href: "/proxies", icon: Network },
  { label: "Tasks", href: "/tasks", icon: Activity },
  { label: "Logs", href: "/logs", icon: Bell },
  { label: "Audit Logs", href: "/audit", icon: ShieldCheck },
  { label: "Admin", href: "/admin", icon: ShieldCheck },
  { label: "Settings", href: "/settings", icon: Settings },
] as const;

export function DashboardShell({ children }: { children: ReactNode }) {
  const menu = useDisclosure();
  const menuId = "primary-navigation";

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-emerald-300 px-4 py-2 font-semibold text-slate-950 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Перейти к содержимому
      </a>

      <div className="flex min-h-dvh">
        <aside
          id={menuId}
          aria-label="Основная навигация"
          className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-border bg-slate-950/95 px-4 py-5 backdrop-blur transition-transform duration-200 lg:static lg:translate-x-0 ${menu.isOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="flex items-center justify-between px-2">
            <Link href="/" className="flex min-h-11 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-300 text-slate-950" aria-hidden="true">
                <ShieldCheck className="h-5 w-5" strokeWidth={2.2} />
              </span>
              <span>
                <span className="block font-mono text-sm font-semibold tracking-wide text-white">INVAIT</span>
                <span className="block text-xs text-slate-500">control plane</span>
              </span>
            </Link>
            <button
              type="button"
              onClick={menu.close}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 lg:hidden"
              aria-label="Закрыть меню"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-8 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
            Operations
          </div>
          <nav className="mt-3 flex-1" aria-label="Разделы панели">
            <ul className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = item.href === "/";

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={menu.close}
                      aria-current={active ? "page" : undefined}
                      className={`group flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 ${active ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"}`}
                    >
                      <Icon className={`h-4 w-4 ${active ? "text-emerald-300" : "text-slate-500 group-hover:text-slate-300"}`} aria-hidden="true" />
                      <span className="flex-1">{item.label}</span>
                      {active ? <ChevronRight className="h-4 w-4 text-slate-600" aria-hidden="true" /> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
              <span className="h-2 w-2 rounded-full bg-amber-300" aria-hidden="true" />
              Stage 1 workspace
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Только UI-каркас. Данные появятся после подключения API.
            </p>
          </div>
        </aside>

        {menu.isOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-slate-950/70 lg:hidden"
            aria-label="Закрыть навигацию"
            onClick={menu.close}
          />
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-border bg-slate-950/85 backdrop-blur">
            <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={menu.toggle}
                  aria-expanded={menu.isOpen}
                  aria-controls={menuId}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-800 text-slate-300 transition hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 lg:hidden"
                  aria-label={menu.isOpen ? "Закрыть меню" : "Открыть меню"}
                >
                  <Menu className="h-5 w-5" aria-hidden="true" />
                </button>
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.16em] text-slate-500">Workspace</p>
                  <p className="text-sm font-medium text-slate-200">Operations overview</p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <span className="hidden rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-xs font-medium text-amber-200 sm:inline-flex">
                  API not connected
                </span>
                <button
                  type="button"
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                  aria-label="Уведомления (пока недоступны)"
                  disabled
                >
                  <Bell className="h-5 w-5" aria-hidden="true" />
                </button>
                <div className="hidden h-8 w-px bg-slate-800 sm:block" aria-hidden="true" />
                <div className="flex items-center gap-2">
                  <span className="grid h-9 w-9 place-items-center rounded-full border border-slate-700 bg-slate-800 font-mono text-xs font-semibold text-emerald-200" aria-hidden="true">
                    OP
                  </span>
                  <span className="hidden text-sm text-slate-300 sm:block">Operator</span>
                </div>
              </div>
            </div>
          </header>

          <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
            {children}
          </main>

          <footer className="border-t border-border px-4 py-5 text-xs text-slate-600 sm:px-6 lg:px-8">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span>Invait control plane · Stage 1</span>
              <span className="font-mono">v0.1.0</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
