import type { WorkerCommandEnvelope } from "@invait/contracts";
import type { TelegramGateway, TelegramInviteTarget } from "../telegram/index.js";
import type { AccountLockPort } from "./account-lock.js";
import type { WorkerCommandHandler } from "../types/index.js";
import type { PrismaClient, TaskItemStatus } from "@prisma/client";

export interface InvitationHandlersOptions { readonly workerId: string; readonly gateway: Pick<TelegramGateway, "inviteUser">; readonly lock: AccountLockPort; readonly lockTtlMs?: number; }

function payload(command: WorkerCommandEnvelope): { readonly taskId?: unknown; readonly chatId?: unknown; readonly username?: unknown; readonly telegramId?: unknown; readonly accessHash?: unknown } {
  return typeof command.payload === "object" && command.payload !== null ? command.payload as { readonly taskId?: unknown; readonly chatId?: unknown; readonly username?: unknown; readonly telegramId?: unknown; readonly accessHash?: unknown } : {};
}

export function createInvitationHandlers(options: InvitationHandlersOptions): { readonly PROCESS_INVITATION_ITEM: WorkerCommandHandler } {
  return { PROCESS_INVITATION_ITEM: async (command) => {
    const accountId = command.accountId; if (!accountId) throw new Error("account_id_required");
    if (!options.gateway.inviteUser) throw new Error("telegram_invitations_not_configured");
    const data = payload(command); if (typeof data.chatId !== "string") throw new Error("invitation_chat_required");
    const target: TelegramInviteTarget = { ...(typeof data.username === "string" ? { username: data.username } : {}), ...(typeof data.telegramId === "string" ? { telegramId: data.telegramId } : {}), ...(typeof data.accessHash === "string" ? { accessHash: data.accessHash } : {}) };
    const lease = await options.lock.acquire(accountId, options.workerId, options.lockTtlMs ?? 60_000); if (!lease) return { state: "deferred", reason: "account_locked" };
    try { await options.gateway.inviteUser(accountId, data.chatId, target); return { status: "SUCCESS" }; } finally { await lease.release(); }
  } };
}

export interface PrismaInvitationHandlersOptions extends InvitationHandlersOptions { readonly prisma: PrismaClient; }
export function classifyInvitationError(error: unknown): TaskItemStatus {
  const value = error instanceof Error ? `${error.name} ${error.message}`.toUpperCase() : String(error).toUpperCase();
  if (value.includes("FLOOD_WAIT")) return "FLOOD_WAIT";
  if (value.includes("PRIVACY") || value.includes("USER_PRIVACY_RESTRICTED")) return "PRIVACY_RESTRICTED";
  if (value.includes("USER_NOT_FOUND") || value.includes("USERNAME_INVALID")) return "NOT_FOUND";
  if (value.includes("ALREADY") || value.includes("USER_ALREADY_PARTICIPANT")) return "ALREADY_MEMBER";
  return "FAILED";
}

export function createPrismaInvitationHandlers(options: PrismaInvitationHandlersOptions): { readonly PROCESS_INVITATION_ITEM: WorkerCommandHandler } {
  return { PROCESS_INVITATION_ITEM: async (command) => {
    const data = payload(command); const taskId = typeof data.taskId === "string" ? data.taskId : typeof (command.payload as { readonly invitationTaskId?: unknown })?.invitationTaskId === "string" ? (command.payload as { readonly invitationTaskId: string }).invitationTaskId : undefined;
    if (!taskId) throw new Error("invitation_task_id_required");
    const task = await options.prisma.invitationTask.findUnique({ where: { id: taskId }, include: { accounts: true, users: true } });
    if (!task) throw new Error("invitation_task_not_found");
    const targetValue = task.target as Record<string, unknown>; const target = typeof targetValue.chatId === "string" ? targetValue.chatId : undefined;
    if (!target) throw new Error("invitation_chat_required");
    let processed = 0; let failed = 0;
    for (const account of task.accounts) {
      const lease = await options.lock.acquire(account.telegramAccountId, options.workerId, options.lockTtlMs ?? 60_000);
      if (!lease) continue;
      try {
        for (const user of task.users.filter((item) => item.status === "PENDING")) {
          await options.prisma.invitationUser.update({ where: { id: user.id }, data: { status: "PROCESSING" } });
          try {
            if (!options.gateway.inviteUser) throw new Error("telegram_invitations_not_configured");
            await options.gateway.inviteUser(account.telegramAccountId, target, { ...(user.username ? { username: user.username } : {}), ...(user.telegramId === null ? {} : { telegramId: user.telegramId?.toString() }), ...(user.accessHash ? { accessHash: user.accessHash } : {}) });
            await options.prisma.invitationUser.update({ where: { id: user.id }, data: { status: "INVITED" } }); processed += 1;
          } catch (error) {
            const status = classifyInvitationError(error); await options.prisma.invitationUser.update({ where: { id: user.id }, data: { status } }); failed += 1;
            if (status === "FLOOD_WAIT") break;
          }
        }
      } finally { await lease.release(); }
    }
    await options.prisma.invitationTask.update({ where: { id: task.id }, data: { status: failed > 0 ? "FAILED" : "COMPLETED", updatedAt: new Date() } });
    return { processed, failed };
  } };
}
