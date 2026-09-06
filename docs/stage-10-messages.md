# Stage 10 — Messages

Реализованы сообщения через безопасный cache/queue boundary:

- `GET /api/messages?chatId=<uuid>&limit=50&before=<telegramId>` — пагинация кэшированной истории (до 100 записей);
- `POST /api/messages/sync?chatId=<uuid>` — асинхронная команда `LOAD_MESSAGES`;
- `POST /api/messages` — асинхронная команда `SEND_MESSAGE` с текстом до 4096 символов и optional reply;
- ownership filtering чата и аккаунта применяется до чтения/отправки;
- worker использует account lock и `TelegramGateway` seam;
- GramJS загружает/отправляет текстовые сообщения и upsert-ит `MessageCache` через Prisma;
- frontend `/chats` показывает сообщения, запускает загрузку и отправляет текст.

Telegram RPC/FloodWait/PeerFlood ошибки не обходятся и не ретраятся стратегиями ротации. Медиа-вложения, reactions и realtime остаются для следующих этапов.
