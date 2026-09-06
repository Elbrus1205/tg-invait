import type { WorkerCommandEnvelope } from "@invait/contracts";
import type { AccountLockPort } from "./account-lock.js";
import type { WorkerCommandHandler } from "../types/index.js";
import type { TelegramGateway } from "../telegram/index.js";

export interface DialogHandlersOptions { readonly workerId: string; readonly gateway: Pick<TelegramGateway, "loadDialogs">; readonly lock: AccountLockPort; readonly lockTtlMs?: number; }

export function createDialogHandlers(options: DialogHandlersOptions): { readonly LOAD_DIALOGS: WorkerCommandHandler } {
  return {
    LOAD_DIALOGS: async (command: WorkerCommandEnvelope) => {
      const accountId = command.accountId;
      if (!accountId) throw new Error("account_id_required");
      if (!options.gateway.loadDialogs) throw new Error("telegram_dialogs_not_configured");
      const lease = await options.lock.acquire(accountId, options.workerId, options.lockTtlMs ?? 60_000);
      if (!lease) return { state: "deferred", reason: "account_locked" };
      try {
        const dialogs = await options.gateway.loadDialogs(accountId);
        return { loaded: dialogs.length };
      } finally {
        await lease.release();
      }
    }
  };
}
