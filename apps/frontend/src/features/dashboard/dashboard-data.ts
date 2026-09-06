import type {
  DashboardEvent,
  DashboardMetric,
  ServiceHealth,
} from "@/types/dashboard";

/**
 * Static Stage 1 data keeps the shell useful before API integration lands.
 * Replace these collections with a typed service call in a later stage.
 */
export const dashboardMetrics: readonly DashboardMetric[] = [
  {
    id: "accounts",
    label: "Telegram accounts",
    value: "—",
    detail: "Подключение появится на этапе 6",
    tone: "info",
    icon: "users",
  },
  {
    id: "tasks",
    label: "Active tasks",
    value: "—",
    detail: "Очередь будет добавлена на этапе 12",
    tone: "default",
    icon: "activity",
  },
  {
    id: "workers",
    label: "Active workers",
    value: "—",
    detail: "Статус worker появится на этапе 7",
    tone: "warning",
    icon: "server",
  },
  {
    id: "messages",
    label: "Messages today",
    value: "—",
    detail: "Realtime обновления — на этапе 16",
    tone: "positive",
    icon: "database",
  },
];

export const dashboardEvents: readonly DashboardEvent[] = [
  {
    id: "shell-ready",
    title: "Dashboard shell готов",
    description: "Адаптивная навигация и базовые статусы доступны локально.",
    timestamp: "сейчас",
    tone: "positive",
  },
  {
    id: "api-pending",
    title: "API ещё не подключён",
    description: "Карточки намеренно показывают placeholder до появления backend API.",
    timestamp: "этап 1",
    tone: "warning",
  },
  {
    id: "security-boundary",
    title: "Граница безопасности обозначена",
    description: "Сессии Telegram и секреты не попадают в frontend-код.",
    timestamp: "зафиксировано",
    tone: "info",
  },
];

export const serviceHealth: readonly ServiceHealth[] = [
  {
    id: "frontend",
    name: "Frontend",
    description: "Next.js App Router",
    status: "operational",
    latency: "локально",
  },
  {
    id: "backend",
    name: "Backend API",
    description: "Команды и валидация",
    status: "offline",
    latency: "этап 2+",
  },
  {
    id: "postgres",
    name: "PostgreSQL",
    description: "Данные панели",
    status: "offline",
    latency: "этап 3",
  },
  {
    id: "redis",
    name: "Redis / BullMQ",
    description: "Очереди задач",
    status: "offline",
    latency: "этап 2+",
  },
];
