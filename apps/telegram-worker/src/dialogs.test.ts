import { describe, expect, it } from "vitest";
import { InMemoryAccountLockRegistry } from "./workers/account-lock.js";
import { createDialogHandlers } from "./workers/dialogs.js";

describe("dialog sync worker handlers", () => {
  it("loads dialogs through the Telegram gateway behind an account lock", async () => {
    const calls: string[] = [];
    const handlers = createDialogHandlers({
      workerId: "worker-a",
      gateway: {
        loadDialogs: async (accountId) => {
          calls.push(accountId);
          return [{ telegramId: 42n, type: "PRIVATE", title: "Alice", username: "alice" }];
        }
      },
      lock: new InMemoryAccountLockRegistry()
    });

    const result = await handlers.LOAD_DIALOGS({
      id: "command-1",
      type: "LOAD_DIALOGS",
      accountId: "account-1",
      payload: {},
      createdAt: new Date().toISOString(),
      attempt: 0
    });

    expect(calls).toEqual(["account-1"]);
    expect(result).toEqual({ loaded: 1 });
  });
});
