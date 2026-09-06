# Stage 12 — Tasks

- `POST /api/tasks` creates a durable PostgreSQL task in `DRAFT` state and validates that all selected accounts belong to the authenticated user.
- `GET /api/tasks` lists the user's tasks with optional status filtering.
- `POST /api/tasks/:id/queue` transitions a task to `QUEUED` and enqueues `PROCESS_TASK` through BullMQ; `POST /api/tasks/:id/cancel` cancels it.
- Task state includes accounts, target/source JSON, progress, error, timestamps, and survives backend/worker restarts in Prisma.
- Worker task lifecycle is isolated behind `TaskStatePort` and `TaskExecutorPort`; Prisma state updates record `RUNNING`, `COMPLETED`, and `FAILED`.
- Frontend route `/tasks` provides basic task creation, listing, and queue controls.

Task-specific Telegram actions remain behind their existing command/gateway seams and continue to respect Telegram restrictions. Invitation-specific execution belongs to Stage 13.
