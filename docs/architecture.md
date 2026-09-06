# Architecture and module seams

## Responsibilities

| Module | Owns | Must not own |
| --- | --- | --- |
| `apps/frontend` | rendering, navigation, user intent, realtime presentation | Telegram credentials, session material, direct database access |
| `apps/backend` | auth/RBAC, validation, persistence orchestration, queue submission, read models | long-running Telegram calls |
| `apps/telegram-worker` | queue consumption, account locks, Telegram adapters, bounded retries, status updates | HTTP request lifecycle or user password handling |
| `packages/contracts` | small interfaces shared across process seams | framework-specific implementations |
| `packages/domain` | status vocabulary and policy data types | network or persistence side effects |
| `packages/config` | environment parsing and safe defaults | secret logging or configuration mutation |

## Stage 2 runtime topology

Stage 2 uses three local Node.js processes: `frontend`, `backend`, and `telegram-worker`. The frontend serves the dashboard on port 3000 and the backend serves health endpoints on port 4000; the worker does not expose a public listener. Each process starts independently through a root `dev:*` command, so process boundaries are exercised without Docker.

The worker has its own process and entry point. It publishes a no-op heartbeat in Stage 2 so its lifecycle can be exercised without claiming that Redis or GramJS is integrated. Redis, queue, and Telegram adapters remain explicit seams for later stages.

## Stage 3 persistence seam

`prisma/schema.prisma` owns the PostgreSQL data model and migrations. The backend exports one process-local Prisma client from `apps/backend/src/database`; it does not connect while the module loads, which keeps the existing liveness endpoint independent of database availability. Later repositories are the only layer allowed to depend on this client; HTTP handlers and frontend code stay storage-agnostic.

## External seams

The first stage defines three deliberate seams:

1. `CommandQueuePort` — backend submits an immutable command envelope; BullMQ is a future adapter and an in-memory adapter will be used by tests.
2. `WorkerHeartbeatPort` — workers publish liveness without exposing their process internals; Redis is a future adapter.
3. `TelegramGateway` (planned) — a worker-facing port for GramJS; the production adapter will be separate from a deterministic test adapter.

Each seam keeps a small interface and hides connection details, retries, redaction, and policy checks behind its implementation. Callers observe results and typed errors rather than adapter internals.

## Command lifecycle

```text
HTTP request
  │ validate + authorize
  ▼
CommandQueuePort.enqueue
  │ durable queue adapter
  ▼
Worker claims account lock
  │ policy checks (ownership, status, Telegram limits)
  ▼
TelegramGateway operation
  │ result/error event
  ▼
Persistence + realtime notification
```

The worker must stop the relevant action on a Telegram restriction and persist the official wait time where one is supplied. It must never switch accounts or proxies merely to continue a restricted action.

## HTTP route inventory (planned)

`/api/auth`, `/api/users`, `/api/accounts`, `/api/account-groups`, `/api/proxies`, `/api/proxy-groups`, `/api/chats`, `/api/messages`, `/api/contacts`, `/api/tasks`, `/api/invitations`, `/api/workers`, `/api/logs`, `/api/audit`, `/api/notifications`, `/api/settings`, and `/api/system`.

Health endpoints are intentionally stable and small: `/health`, `/health/live`, and `/health/ready`.

## Stage 1 acceptance

- Workspace packages have independent entry points and scripts.
- Backend and worker are separate processes in the filesystem and package graph.
- Shared contracts do not import Fastify, Next.js, Prisma, Redis, or GramJS.
- The frontend is a presentational shell only.
- Typecheck, lint, and smoke tests run from the repository root.
