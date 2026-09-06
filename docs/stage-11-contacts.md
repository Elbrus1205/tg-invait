# Stage 11 — Contacts

- `GET /api/contacts` supports `accountId`, `search`, `limit`, and `before` and returns only contacts of accounts owned by the authenticated user.
- `POST /api/contacts/sync?accountId=<uuid>` queues `LOAD_CONTACTS` for the Telegram worker.
- GramJS loads Telegram users through `contacts.GetContacts`, normalizes them to Prisma `Contact`, and does not expose session material.
- Contact phone numbers are masked in API responses.
- Frontend route `/contacts` provides search, listing, and synchronization controls.

The enum value `TaskType.LOAD_CONTACTS` requires the SQL migration in `prisma/migrations/20260906120000_load_contacts_task_type/migration.sql` (and the matching Supabase SQL editor file).
