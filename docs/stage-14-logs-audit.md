# Stage 14 — Logs and Audit Logs

Backend exposes read-only `GET /api/logs` and `GET /api/audit` endpoints. Both require an authenticated user with read permission and enforce ownership for account/task records.

Logs support filtering by `type`, `level`, `accountId`, `taskId`, `search`, and cursor pagination (`limit`, `before`). Audit records support `entity`, `search`, and cursor pagination. Audit records are append-only at the store seam: there are no update or delete operations.

Responses contain operational metadata only; password hashes, Telegram sessions, encrypted proxy credentials, reset tokens, and other secrets are never returned by these endpoints.

The dashboard includes `/logs` and `/audit` views for operators. Invitation/import queue mutations remain observable through task and operational records; Telegram invitation execution itself is still deferred to the worker stage and does not bypass Telegram restrictions.
