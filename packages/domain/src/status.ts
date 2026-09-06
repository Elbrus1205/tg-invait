export const accountStatuses = [
  "online",
  "offline",
  "connecting",
  "flood_wait",
  "unauthorized",
  "proxy_error",
  "telegram_error",
  "disabled"
] as const;

export type AccountStatus = (typeof accountStatuses)[number];

export const taskStatuses = ["draft", "queued", "running", "paused", "completed", "failed", "cancelled"] as const;

export type TaskStatus = (typeof taskStatuses)[number];

export const invitationItemStatuses = [
  "pending",
  "processing",
  "invited",
  "already_member",
  "privacy_restricted",
  "not_found",
  "flood_wait",
  "failed",
  "skipped"
] as const;

export type InvitationItemStatus = (typeof invitationItemStatuses)[number];
