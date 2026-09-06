# Invait TG

Safety-first foundation for a Telegram account management platform running on a VDS.

This repository is being implemented in the stages defined by the supplied project specification. The current checkpoint is **Stage 7: Telegram Worker**. Telegram actions are not executed by HTTP handlers; all actions remain limited to accounts and chats the operator owns or is explicitly authorised to manage.

## Architecture

```text
Next.js frontend
        │ HTTPS / WebSocket
        ▼
Node.js backend ───────► PostgreSQL (Prisma)
        │                 Redis (BullMQ)
        ▼
Telegram worker pool ──► GramJS / MTProto ──► Telegram accounts
```

The backend owns authentication, validation, authorization, persistence, and queue submission. Workers own long-running Telegram operations. A single account is assigned to one worker at a time through a Redis lock with TTL and token-safe renewal/release; the HTTP process never performs a long Telegram operation inline.

## Workspace layout

- `apps/frontend` — Next.js App Router dashboard shell.
- `apps/backend` — HTTP API composition root and public backend modules.
- `apps/telegram-worker` — isolated worker process and command processors.
- `packages/contracts` — transport-neutral command, health, and heartbeat interfaces.
- `packages/domain` — shared domain vocabulary and safety-related state types.
- `packages/config` — validated environment configuration boundary.
- `docs/architecture.md` — seams, invariants, and planned API surface.

## Local commands

```bash
npm install
npm run dev:backend
npm run dev:worker
npm run dev:frontend
npm run typecheck
npm run lint
npm test
npm run build
```

Stage 2 runs the frontend, backend, and isolated worker as separate local Node.js processes, without Docker. Start each `dev:*` command in its own terminal. The backend listens on `http://localhost:4000` and the frontend on `http://localhost:3000`; the worker has no public HTTP interface. Copy `.env.example` to a local `.env` only on a development machine and keep real secrets out of source control.

## Backend API (Stage 4)

The backend exposes `/api/auth` (registration, login, refresh, logout, current user, password reset), `/api/users`, `/api/accounts`, `/api/proxies`, and a redacted `/api/openapi.json` document. Passwords use Argon2id. Access and refresh tokens are signed separately; refresh sessions are stored by token hash and rotated on use. Proxy username/password values are encrypted with AES-256-GCM at the persistence seam and never appear in responses. Account and proxy CRUD is storage-backed and does not call Telegram inline.

## Proxy Manager (Stage 5)

The proxy API supports SOCKS5, HTTP, and HTTPS records; individual CRUD; bulk text import in `ip:port`, `login:password@ip:port`, and `ip:port:login:password` formats; disable; test; and test-all operations. Network checks are isolated behind `ProxyChecker`, update ping/status/last-check/error fields, and do not rotate proxies or interact with Telegram. Credentials are decrypted only inside the server-side checker boundary and remain redacted from responses.

## Telegram Account Manager (Stage 6)

Account connection is modeled as a queued lifecycle. `POST /api/accounts/connect/request` (also available as `/api/accounts/connect`) creates a `CONNECTING` account and enqueues a `CONNECT_ACCOUNT` command for code delivery. `POST /api/accounts/{id}/connect/verify` accepts the code and optional 2FA password, encrypting the password before it enters the command envelope. `POST /api/accounts/{id}/disconnect` enqueues `DISCONNECT_ACCOUNT`. Ownership and RBAC are checked before persistence or queue submission; HTTP never calls Telegram inline.

## Telegram Worker (Stage 7)

## TData Import (Stage 8)

The worker validates ZIP archives with strict size/file/path limits and checks for Telegram Desktop `key_datas` plus `mapN` structure. Conversion is isolated behind `TDataConverter`; unsupported TData is rejected without exposing archive content or session material. See `docs/stage-8-tdata-import.md`.

Chats (Stage 9) are available through `GET /api/chats` and asynchronous `POST /api/chats/sync?accountId=<uuid>`. The frontend provides `/chats` and `/accounts/import-tdata` controls.

Messages (Stage 10) use paginated `GET /api/messages`, queued `POST /api/messages/sync`, and queued `POST /api/messages`; see `docs/stage-10-messages.md`.

Contacts (Stage 11) use `GET /api/contacts` and queued `POST /api/contacts/sync`; see `docs/stage-11-contacts.md`.

Tasks (Stage 12) use durable `GET/POST /api/tasks`, queue/cancel actions, and BullMQ `PROCESS_TASK`; see `docs/stage-12-tasks.md`.

Invitations (Stage 13) provide CSV/XLS/XLSX preview/import history and owned invitation task queueing; see `docs/stage-13-invitations.md`.

The worker package provides BullMQ command consumption, Redis heartbeats, token-safe Redis account locks, and a GramJS gateway for request-code, verify-code/2FA, encrypted session persistence, reconnect, and disconnect. `CONNECT_ACCOUNT` and `DISCONNECT_ACCOUNT` handlers call only the injected `TelegramGateway`, persist lifecycle changes through a state port, and defer when an account is already locked by another worker. GramJS automatic RPC retries and FloodWait sleeping are disabled. Assigned SOCKS5 proxies are honored; HTTP/HTTPS assignments fail explicitly because GramJS does not support them for this transport. Tests and local composition retain deterministic in-memory adapters.

## Database (Stage 3)

Stage 3 adds the PostgreSQL schema and Prisma client without starting a database service. Set `DATABASE_URL` to an operator-managed local or remote PostgreSQL instance, then run:

```bash
npm run db:generate
npm run db:migrate:dev -- --name init
```

`npm run db:validate` checks the schema without connecting to PostgreSQL, but Prisma still requires a syntactically valid `DATABASE_URL` in the environment. The backend does not connect eagerly, so `/health/live` remains available while database-backed modules are still being introduced.

## Safety invariants

- Only owned or explicitly authorised Telegram accounts and dialogs may be operated.
- FLOOD_WAIT, PEER_FLOOD, privacy restrictions, and other Telegram limits are stop conditions, never something to bypass.
- No automatic account/proxy rotation is used to evade a Telegram restriction.
- Telegram sessions and proxy credentials will be encrypted and redacted before they reach a frontend response or log.
