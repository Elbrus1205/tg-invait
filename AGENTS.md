# Agent and contributor guidance

## Scope

Implement the supplied Telegram VDS specification in its numbered stages. Do not skip a stage's verification gate or silently broaden a stage's scope.

## Code style

- TypeScript is strict; prefer explicit domain types and immutable command envelopes.
- Keep modules deep at their seams: callers should not know database, queue, or Telegram adapter details.
- Keep frontend code presentational and keep secrets/session material server-side.
- Use the existing workspace scripts from the repository root.

## Safety

- Operate only on Telegram accounts/chats the user owns or is authorised to manage.
- Treat Telegram restrictions as hard stop conditions. Never add account/proxy rotation, fingerprint spoofing, or a retry strategy intended to evade a restriction.
- Redact credentials and session strings from logs, errors, fixtures, and snapshots.

## Verification

Before declaring a stage complete, run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` when a build exists. Report the exact command and result.
