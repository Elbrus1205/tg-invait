import { randomUUID } from "node:crypto";
import { Redis as RedisClient } from "ioredis";
import type { AccountLockLease, AccountLockPort } from "./account-lock.js";
export interface RedisAccountLockOptions { readonly redisUrl: string; readonly ttlMs?: number; readonly keyPrefix?: string; }
const renewScript = "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('pexpire', KEYS[1], ARGV[2]) else return 0 end";
const releaseScript = "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";
export class RedisAccountLockRegistry implements AccountLockPort {
  private readonly redis: RedisClient; private readonly ttlMs: number; private readonly prefix: string;
  public constructor(options: RedisAccountLockOptions) { this.redis = new RedisClient(options.redisUrl, { lazyConnect: true }); this.ttlMs = options.ttlMs ?? 60_000; this.prefix = options.keyPrefix ?? "telegram_account_lock:"; }
  public async acquire(accountId: string, workerId: string, ttlMs = this.ttlMs): Promise<AccountLockLease | undefined> { if (this.redis.status === "wait") await this.redis.connect(); const token = `${workerId}:${randomUUID()}`; const key = `${this.prefix}${accountId}`; const acquired = await this.redis.set(key, token, "PX", ttlMs, "NX"); if (acquired !== "OK") return undefined; let released = false; return { accountId, workerId, renew: async () => !released && Number(await this.redis.eval(renewScript, 1, key, token, String(ttlMs))) === 1, release: async () => { if (released) return false; released = true; return Number(await this.redis.eval(releaseScript, 1, key, token)) === 1; } }; }
  public async close(): Promise<void> { await this.redis.quit(); }
}
