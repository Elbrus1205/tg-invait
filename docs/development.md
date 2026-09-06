# Development workflow

The supplied specification is intentionally implemented as vertical stages. Each stage has a small acceptance gate so a later feature cannot silently weaken an earlier safety invariant.

## Stage 1

Architecture and folder structure only: workspace packages, public seams, a health server, a dashboard shell, and shared domain vocabulary.

## Stage 2 (current)

Local process infrastructure: frontend, backend, and the isolated Telegram worker run as separate Node.js processes without Docker. The backend binds to `localhost:4000`, the frontend to `localhost:3000`, and the worker has no public network listener. The worker entry point remains safe and inert with respect to Telegram until its infrastructure adapter is implemented in a later stage.

After copying `.env.example` to `.env`, start each process in a separate terminal:

```bash
npm run dev:backend
npm run dev:worker
npm run dev:frontend
```

Redis URLs are retained as future configuration boundaries. PostgreSQL becomes available through Prisma in Stage 3. Do not put real credentials, Telegram sessions, or proxy passwords in `.env` files that might be shared or committed.

## Stage 3 (current)

PostgreSQL persistence uses Prisma and the schema at `prisma/schema.prisma`. Docker is not required: point `DATABASE_URL` at an operator-managed PostgreSQL instance. Generate the client and create the initial migration with:

```bash
npm run db:generate
npm run db:migrate:dev -- --name init
```

Use `npm run db:validate` to validate the schema without a running database; Prisma still requires a syntactically valid `DATABASE_URL`. Authentication, authorization, proxy management, and all Telegram operations remain deferred to their dedicated stages.

## Stage 4

The backend API now includes an explicit `ApiStore` seam, an in-memory adapter for API tests, and a Prisma adapter for production composition. Auth uses Argon2id password hashes, HMAC-signed short-lived access tokens, rotating refresh sessions, RBAC roles, and a notifier seam for password reset. Account phone numbers are masked in read models. Proxy credentials are encrypted with AES-256-GCM and redacted from all API payloads. HTTP handlers only persist metadata and never run long Telegram work inline.

## Stage 5

Proxy Manager extends the backend with CRUD, bulk import, disable, single test, and test-all routes. `ProxyChecker` owns protocol/network details while controllers only validate, authorize, and persist the result. Tests inject a deterministic checker. The production checker has bounded timeouts and classifies online, offline, timeout, and authentication failures without any account/proxy rotation behavior.

## Stage 6

Telegram Account Manager introduces queued account lifecycle commands. Request-code, verify-code, and disconnect routes persist account metadata and submit immutable envelopes through `CommandQueuePort`; no GramJS or long-running Telegram operation is executed in an HTTP handler. Optional 2FA passwords are encrypted before entering a command payload, and account reads remain ownership-filtered and phone-masked. TData import and live Telegram adapter work remain in their dedicated later stages.

## Stage 7

Telegram Worker adds production queue and coordination adapters. `BullMqCommandQueue` publishes immutable command envelopes and `BullMqCommandConsumer` acknowledges jobs only after the handler resolves. `RedisWorkerHeartbeatPort` publishes expiring heartbeats, while `RedisAccountLockRegistry` uses token-checked Redis scripts for TTL renewal and safe release under `telegram_account_lock:{accountId}`. The GramJS gateway handles the request-code and verify-code/2FA phases, encrypts temporary Redis auth state and final Prisma sessions with AES-256-GCM, disables automatic RPC/FloodWait retry behavior, and fails hard for unsupported HTTP/HTTPS Telegram proxy transport. No rotation, spoofing, or restriction bypass behavior is included.

## Stage 8

TData Import adds a bounded ZIP inspector and `POST /api/accounts/import-tdata`. The API encrypts archive bytes before queuing `IMPORT_TDATA`; it never returns or logs TData contents. The worker validates `key_datas` plus `mapN`, rejects traversal/oversized archives, and keeps conversion behind the explicit `TDataConverter` seam. Unsupported TData is reported as `unsupported_tdata_format` without persisting plaintext session material.

## Verification gate

Run from the repository root:

```bash
npm install
npm run typecheck
npm run lint
npm test
npm run build
```

If an external dependency is unavailable, report that fact and keep the failed command/output visible. Do not mark an unverified stage complete.

## Change discipline

- Keep process seams transport-neutral (`packages/contracts`).
- Test behavior through public interfaces, not private implementation details.
- Add a migration/ADR when a decision changes persistence or security semantics.
- Never add real secrets, TData, raw sessions, proxy passwords, or upload files to the repository.
