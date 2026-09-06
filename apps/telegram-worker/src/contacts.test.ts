import { describe, expect, it } from "vitest";
import { InMemoryAccountLockRegistry } from "./workers/account-lock.js";
import { createContactHandlers } from "./workers/contacts.js";

describe("contact sync worker handlers", () => {
  it("loads contacts through the Telegram gateway behind an account lock", async () => {
    const calls: string[] = [];
    const handlers = createContactHandlers({ workerId: "worker-a", gateway: { loadContacts: async (accountId) => { calls.push(accountId); return [{ telegramId: 77n, firstName: "Alice" }]; } }, lock: new InMemoryAccountLockRegistry() });
    const result = await handlers.LOAD_CONTACTS({ id: "command-1", type: "LOAD_CONTACTS", accountId: "account-1", payload: {}, createdAt: new Date().toISOString(), attempt: 0 });
    expect(result).toEqual({ loaded: 1 });
    expect(calls).toEqual(["account-1"]);
  });
});
