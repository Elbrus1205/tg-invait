# Project context

## Ubiquitous language

- **Telegram account** — an owned or explicitly authorised Telegram identity managed by the platform.
- **Worker** — a separate process that owns a live Telegram connection and executes queued commands.
- **Command** — an immutable request submitted by the backend and consumed by a worker.
- **Invitation** — an explicitly permitted Telegram action; a Telegram restriction is a stop condition.
- **Account invitation settings** — a per-account copy of the defaults, with stricter limits allowed at task level.
- **Seam** — the public interface where an implementation can be replaced by a test adapter or a future infrastructure adapter.

## Non-negotiable invariants

1. HTTP handlers never run long Telegram work inline.
2. One live worker owns a Telegram account at a time.
3. Telegram restrictions (including `FLOOD_WAIT`, `PEER_FLOOD`, and privacy errors) override local settings.
4. No account or proxy rotation is used to evade a Telegram restriction.
5. Session material and credentials are secrets: they are encrypted at rest and redacted from logs/responses.
