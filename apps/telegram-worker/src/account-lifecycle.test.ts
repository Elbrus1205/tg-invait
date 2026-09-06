import { describe, expect, it } from "vitest";
import { InMemoryAccountLockRegistry, assertCommandHandled, createAccountLifecycleHandlers, decodeEncryptionKey } from "./index.js";

describe("account lifecycle worker handlers", () => {
  it("accepts a Base64 encoding of a 32-byte encryption key", () => {
    const encoded = Buffer.alloc(32, 7).toString("base64");
    expect(decodeEncryptionKey(encoded)).toHaveLength(32);
  });
  it("does not acknowledge deferred or rejected queue results", () => {
    expect(() => assertCommandHandled({ status: "deferred" })).toThrow("command_deferred");
    expect(() => assertCommandHandled({ status: "rejected" })).toThrow("command_rejected");
    expect(() => assertCommandHandled({ status: "completed" })).not.toThrow();
  });
  it("serializes account work with a TTL lock and releases it after completion", async () => {
    const lock = new InMemoryAccountLockRegistry();
    const first = await lock.acquire("account-1", "worker-a", 10_000);
    expect(first).toBeDefined();
    expect(await lock.acquire("account-1", "worker-b", 10_000)).toBeUndefined();
    expect(await first!.release()).toBe(true);
    expect(await lock.acquire("account-1", "worker-b", 10_000)).toBeDefined();
  });

  it("expires an abandoned lease and refuses stale renewal", async () => {
    let now = 0;
    const lock = new InMemoryAccountLockRegistry({ now: () => now });
    const stale = await lock.acquire("account-1", "worker-a", 100);
    now = 101;
    expect(await stale!.renew()).toBe(false);
    expect(await lock.acquire("account-1", "worker-b", 100)).toBeDefined();
  });

  it("uses the Telegram gateway only behind the lifecycle handler", async () => {
    const calls: string[] = [];
    const statuses: string[] = [];
    const handlers = createAccountLifecycleHandlers({
      workerId: "worker-a",
      gateway: { connect: async (id) => { calls.push(`connect:${id}`); }, disconnect: async (id) => { calls.push(`disconnect:${id}`); } },
      lock: new InMemoryAccountLockRegistry(),
      state: { setStatus: async (_id, status) => { statuses.push(status); } }
    });
    const command = { id: "command-1", type: "CONNECT_ACCOUNT" as const, accountId: "account-1", payload: { phase: "request_code" }, createdAt: new Date().toISOString(), attempt: 0 };
    await handlers.CONNECT_ACCOUNT(command);
    expect(calls).toEqual(["connect:account-1"]);
    expect(statuses).toEqual(["CONNECTING", "ONLINE"]);
  });

  it("keeps an account connecting after Telegram sends the login code", async () => {
    const statuses: string[] = [];
    const handlers = createAccountLifecycleHandlers({
      workerId: "worker-a",
      gateway: { connect: async () => "CODE_SENT", disconnect: async () => undefined },
      lock: new InMemoryAccountLockRegistry(),
      state: { setStatus: async (_id, status) => { statuses.push(status); } }
    });
    await handlers.CONNECT_ACCOUNT({ id: "command-2", type: "CONNECT_ACCOUNT", accountId: "account-1", payload: { phase: "request_code" }, createdAt: new Date().toISOString(), attempt: 0 });
    expect(statuses).toEqual(["CONNECTING"]);
  });
});
