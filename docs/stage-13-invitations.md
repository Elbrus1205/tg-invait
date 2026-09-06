# Stage 13 — Invitations and imports

- Добавлен нормализующий CSV/XLS/XLSX parser с обязательной колонкой `username`, очисткой `@`, валидацией, удалением пустых строк и дублей.
- `POST /api/invitations/tasks` создаёт draft invitation task только для owned target chat/account.
- `POST /api/invitations/import` сохраняет import history и preview counts (`valid`, `invalid`, `duplicates`).
- `GET /api/invitations/tasks`, `GET /api/invitations/imports` ограничены ownership.
- `POST /api/invitations/tasks/:id/queue` ставит `PROCESS_INVITATION_ITEM` в BullMQ.
- Frontend route `/invitations` добавлен в навигацию.

Фактические Telegram invite actions и обработка FloodWait/privacy restrictions остаются за worker implementation следующего шага; обход ограничений и account/proxy rotation не выполняются.
