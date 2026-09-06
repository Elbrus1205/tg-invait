import type { WorkerCommandEnvelope } from "@invait/contracts";
import type { AccountLockPort } from "./account-lock.js";
import type { WorkerCommandHandler } from "../types/index.js";
import type { TelegramGateway } from "../telegram/index.js";
export interface ContactHandlersOptions { readonly workerId: string; readonly gateway: Pick<TelegramGateway, "loadContacts">; readonly lock: AccountLockPort; readonly lockTtlMs?: number; }
export function createContactHandlers(options: ContactHandlersOptions): { readonly LOAD_CONTACTS: WorkerCommandHandler } { return { LOAD_CONTACTS: async (command: WorkerCommandEnvelope) => { const accountId = command.accountId; if (!accountId) throw new Error("account_id_required"); if (!options.gateway.loadContacts) throw new Error("telegram_contacts_not_configured"); const lease = await options.lock.acquire(accountId, options.workerId, options.lockTtlMs ?? 60_000); if (!lease) return { state: "deferred", reason: "account_locked" }; try { const contacts = await options.gateway.loadContacts(accountId); return { loaded: contacts.length }; } finally { await lease.release(); } } }; }
