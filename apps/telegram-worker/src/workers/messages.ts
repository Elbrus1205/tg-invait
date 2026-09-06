import type { WorkerCommandEnvelope } from "@invait/contracts";
import type { AccountLockPort } from "./account-lock.js";
import type { WorkerCommandHandler } from "../types/index.js";
import type { TelegramGateway } from "../telegram/index.js";

export interface MessageHandlersOptions { readonly workerId: string; readonly gateway: Pick<TelegramGateway, "loadMessages" | "sendMessage">; readonly lock: AccountLockPort; readonly lockTtlMs?: number; }
function payload(command: WorkerCommandEnvelope): Record<string, unknown> { return typeof command.payload === "object" && command.payload !== null ? command.payload as Record<string, unknown> : {}; }
async function withLock(command: WorkerCommandEnvelope, options: MessageHandlersOptions, operation: (accountId: string) => Promise<unknown>): Promise<unknown> { const accountId = command.accountId; if (!accountId) throw new Error("account_id_required"); const lease = await options.lock.acquire(accountId, options.workerId, options.lockTtlMs ?? 60_000); if (!lease) return { state: "deferred", reason: "account_locked" }; try { return await operation(accountId); } finally { await lease.release(); } }

export function createMessageHandlers(options: MessageHandlersOptions): { readonly LOAD_MESSAGES: WorkerCommandHandler; readonly SEND_MESSAGE: WorkerCommandHandler } {
  return {
    LOAD_MESSAGES: (command) => withLock(command, options, async (accountId) => { if (!options.gateway.loadMessages) throw new Error("telegram_messages_not_configured"); const p = payload(command); if (typeof p.chatId !== "string") throw new Error("chat_id_required"); const messages = await options.gateway.loadMessages(accountId, p.chatId, { ...(typeof p.limit === "number" ? { limit: p.limit } : {}), ...(typeof p.before === "string" && /^-?\d+$/.test(p.before) ? { before: BigInt(p.before) } : {}) }); return { loaded: messages.length }; }),
    SEND_MESSAGE: (command) => withLock(command, options, async (accountId) => { if (!options.gateway.sendMessage) throw new Error("telegram_messages_not_configured"); const p = payload(command); if (typeof p.chatId !== "string" || typeof p.text !== "string") throw new Error("message_payload_invalid"); const replyToId = typeof p.replyToId === "string" && /^\d+$/.test(p.replyToId) ? BigInt(p.replyToId) : undefined; const message = await options.gateway.sendMessage(accountId, p.chatId, p.text, replyToId); return { telegramId: message.telegramId.toString() }; })
  };
}
