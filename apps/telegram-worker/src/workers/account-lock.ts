import { randomUUID } from "node:crypto";

export interface AccountLockLease {
  readonly accountId: string;
  readonly workerId: string;
  renew(): Promise<boolean>;
  release(): Promise<boolean>;
}

export interface AccountLockPort {
  acquire(accountId: string, workerId: string, ttlMs: number): Promise<AccountLockLease | undefined>;
}

export interface LockClock { now(): number; }

interface LockRecord { readonly token: string; readonly workerId: string; readonly expiresAt: number; }

/** In-memory implementation used by tests; Redis uses the same port. */
export class InMemoryAccountLockRegistry implements AccountLockPort {
  private readonly locks = new Map<string, LockRecord>();
  public constructor(private readonly clock: LockClock = { now: () => Date.now() }) {}
  public async acquire(accountId: string, workerId: string, ttlMs: number): Promise<AccountLockLease | undefined> {
    if (!accountId || !workerId || !Number.isInteger(ttlMs) || ttlMs <= 0) throw new TypeError("account lock arguments are invalid");
    const current = this.locks.get(accountId);
    const now = this.clock.now();
    if (current && current.expiresAt > now) return undefined;
    const token = randomUUID();
    this.locks.set(accountId, { token, workerId, expiresAt: now + ttlMs });
    let released = false;
    return {
      accountId,
      workerId,
      renew: async () => {
        const record = this.locks.get(accountId);
        if (released || !record || record.token !== token || record.workerId !== workerId || record.expiresAt <= this.clock.now()) return false;
        this.locks.set(accountId, { ...record, expiresAt: this.clock.now() + ttlMs });
        return true;
      },
      release: async () => {
        const record = this.locks.get(accountId);
        if (released || !record || record.token !== token || record.workerId !== workerId) return false;
        released = true;
        this.locks.delete(accountId);
        return true;
      }
    };
  }
}
