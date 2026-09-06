# Stage 9 — Chats

Добавлены безопасные границы для работы с диалогами Telegram:

- `GET /api/chats` — список чатов текущего пользователя с фильтрами `accountId`, `type`, `search`;
- `POST /api/chats/sync?accountId=<uuid>` — постановка `LOAD_DIALOGS` в BullMQ/command queue;
- ownership filtering не позволяет читать чаты чужого Telegram-аккаунта;
- worker получает диалоги через `TelegramGateway.loadDialogs` и сохраняет нормализованные записи `Chat` через Prisma upsert;
- добавлены frontend-страницы `/chats` и `/accounts/import-tdata`.

Синхронизация выполняется асинхронно. Сессии, proxy credentials и Telegram API secrets не возвращаются HTTP API или UI. История сообщений и отправка сообщений относятся к Stage 10 и здесь не реализуются.
