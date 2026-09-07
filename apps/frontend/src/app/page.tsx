import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Database,
  Radio,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

import { MetricCard } from "@/components/metric-card";
import { StatusPill } from "@/components/status-pill";
import {
  dashboardEvents,
  dashboardMetrics,
  serviceHealth,
} from "@/features/dashboard/dashboard-data";
import { getHealthSummary } from "@/lib/dashboard-health";

const statusSummary = getHealthSummary(serviceHealth.map((service) => service.status));

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <section aria-labelledby="page-title" className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/45 p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow">Control plane / Stage 1</p>
            <h1 id="page-title" className="mt-3 max-w-xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Спокойный обзор инфраструктуры
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
              Адаптивный каркас панели уже готов. Здесь появятся реальные аккаунты,
              очереди и health-checks, когда следующие этапы подключат backend.
            </p>
          </div>
          <Link
            href="#roadmap"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-300 px-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            Посмотреть границы этапа
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <div className="flex gap-3 text-sm">
            <Link href="/auth/login" className="text-slate-300 hover:text-white">Войти</Link>
            <Link href="/auth/register" className="text-emerald-300 hover:text-emerald-200">Регистрация</Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="metrics-title">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">At a glance</p>
            <h2 id="metrics-title" className="mt-2 text-xl font-semibold text-white">Ключевые показатели</h2>
          </div>
          <span className="hidden text-xs text-slate-500 sm:block">Live data подключится позже</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {dashboardMetrics.map((metric) => <MetricCard key={metric.id} metric={metric} />)}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section aria-labelledby="events-title" className="surface-card p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Timeline</p>
              <h2 id="events-title" className="mt-2 text-xl font-semibold text-white">Последние события</h2>
            </div>
            <Radio className="h-5 w-5 text-slate-500" aria-hidden="true" />
          </div>
          <ol className="mt-6 space-y-5">
            {dashboardEvents.map((event, index) => (
              <li key={event.id} className="relative flex gap-4">
                {index < dashboardEvents.length - 1 ? <span className="absolute left-[9px] top-6 h-[calc(100%+1.25rem)] w-px bg-slate-800" aria-hidden="true" /> : null}
                <span className="relative mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-slate-700 bg-slate-900" aria-hidden="true">
                  <span className={`h-2 w-2 rounded-full ${event.tone === "positive" ? "bg-emerald-300" : event.tone === "warning" ? "bg-amber-300" : "bg-sky-300"}`} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                    <h3 className="text-sm font-medium text-slate-200">{event.title}</h3>
                    <time className="font-mono text-xs text-slate-600">{event.timestamp}</time>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{event.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="services-title" className="surface-card p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Runtime</p>
              <h2 id="services-title" className="mt-2 text-xl font-semibold text-white">Состояние сервисов</h2>
            </div>
            <div className="text-right">
              <p className="font-mono text-2xl font-semibold text-white">{statusSummary.percentage}%</p>
              <p className="text-xs text-slate-500">{statusSummary.healthy}/{statusSummary.total} online</p>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {serviceHealth.map((service) => (
              <div key={service.id} className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/35 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400" aria-hidden="true">
                    {service.id === "frontend" ? <ShieldCheck className="h-4 w-4" /> : service.id === "redis" ? <Radio className="h-4 w-4" /> : <Database className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-200">{service.name}</p>
                    <p className="truncate text-xs text-slate-600">{service.description}</p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <StatusPill status={service.status} />
                  <span className="font-mono text-[10px] text-slate-600">{service.latency}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-900/50 p-3 text-xs leading-5 text-slate-500">
            <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" aria-hidden="true" />
            <p>Статусы сейчас статичны и нужны только для проверки визуальной иерархии.</p>
          </div>
        </section>
      </div>

      <section id="roadmap" aria-labelledby="roadmap-title" className="surface-card p-6 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow">Boundary</p>
            <h2 id="roadmap-title" className="mt-2 text-xl font-semibold text-white">Что входит в этот этап</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Только архитектура frontend и доступный dashboard shell. Авторизация,
              данные Telegram, realtime и операции появятся отдельными этапами.
            </p>
          </div>
          <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-300" aria-label="Этап завершён" />
        </div>
        <ul className="mt-6 grid gap-3 text-sm text-slate-300 sm:grid-cols-2 lg:grid-cols-4">
          {["App Router", "TypeScript boundaries", "Tailwind-ready tokens", "Keyboard-friendly nav"].map((item) => (
            <li key={item} className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/35 px-3 py-3">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
