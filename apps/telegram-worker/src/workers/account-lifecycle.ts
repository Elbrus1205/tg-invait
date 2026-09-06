import type { WorkerCommandEnvelope } from "@invait/contracts";
import type { AccountLockPort } from "./account-lock.js";
import type { WorkerCommandHandler } from "../types/index.js";
import type { TelegramGateway } from "../telegram/index.js";

export type AccountLifecycleStatus = "ONLINE" | "OFFLINE" | "CONNECTING" | "UNAUTHORIZED" | "TELEGRAM_ERROR";
export interface AccountStatePort { setStatus(accountId: string, status: AccountLifecycleStatus, errorState?: string): Promise<void>; }
export interface AccountLifecycleOptions { readonly workerId: string; readonly gateway: TelegramGateway; readonly lock: AccountLockPort; readonly state: AccountStatePort; readonly lockTtlMs?: number; }

async function withAccountLock(command: WorkerCommandEnvelope, options: AccountLifecycleOptions, operation: (accountId: string) => Promise<void>): Promise<unknown> {
  const accountId = command.accountId;
  if (!accountId) throw new Error("account_id_required");
  const lease = await options.lock.acquire(accountId, options.workerId, options.lockTtlMs ?? 60_000);
  if (!lease) return { state: "deferred", reason: "account_locked" };
  const ttlMs = options.lockTtlMs ?? 60_000;
  const renewal = setInterval(() => { void lease.renew().catch(() => undefined); }, Math.max(1_000, Math.floor(ttlMs / 3)));
  try { await operation(accountId); return { state: "completed" }; } finally { clearInterval(renewal); await lease.release(); }
}

export function createAccountLifecycleHandlers(options: AccountLifecycleOptions): { readonly CONNECT_ACCOUNT: WorkerCommandHandler; readonly DISCONNECT_ACCOUNT: WorkerCommandHandler } {
  return {
    CONNECT_ACCOUNT: (command) => withAccountLock(command, options, async (accountId) => {
      await options.state.setStatus(accountId, "CONNECTING");
      try { const result = await options.gateway.connect(accountId, command); if (result === "CODE_SENT") return; await options.state.setStatus(accountId, "ONLINE"); }
      catch (error) { await options.state.setStatus(accountId, "TELEGRAM_ERROR", error instanceof Error && error.name ? error.name : "telegram_error"); throw error; }
    }),
    DISCONNECT_ACCOUNT: (command) => withAccountLock(command, options, async (accountId) => {
      try { await options.gateway.disconnect(accountId); await options.state.setStatus(accountId, "OFFLINE"); }
      catch (error) { await options.state.setStatus(accountId, "TELEGRAM_ERROR", error instanceof Error && error.name ? error.name : "telegram_error"); throw error; }
    })
  };
}
