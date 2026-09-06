# ADR 0001: npm workspace with an isolated Telegram worker

## Status

Accepted for Stage 1.

## Context

The platform needs a web UI, a short-lived HTTP request path, and long-running Telegram work. Keeping those concerns in one process would make request timeouts, retries, and account concurrency unsafe. The project also needs a seam that can later support workers on more than one VDS.

## Decision

Use an npm workspace monorepo with separate applications for `frontend`, `backend`, and `telegram-worker`. Put only transport-neutral types in shared packages. The backend submits commands through a queue port; workers consume commands and report heartbeats/results.

## Consequences

- Each process can be started independently in local development and deployed independently later.
- Tests can replace queue, heartbeat, and Telegram adapters without contacting external systems.
- Shared packages stay deep: callers learn a small interface while implementations own connection, retry, and redaction details.
- Prisma and concrete queue adapters are deferred to their specified stages; Docker is not a requirement for this project.
