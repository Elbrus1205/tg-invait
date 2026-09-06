import { describe, expect, it } from "vitest";
import { InMemoryAccountLockRegistry } from "./workers/account-lock.js";
import { createMessageHandlers } from "./workers/messages.js";

describe("message worker handlers", () => {
  it("loads and sends messages through the Telegram gateway", async () => {
    const calls: string[] = [];
    const handlers = createMessageHandlers({
      workerId: "worker-a",
      gateway: {
        loadMessages: async (accountId, chatId) => { calls.push(`load:${accountId}:${chatId}`); return [{ telegramId: 1n, body: "hello", sentAt: new Date() }]; },
        sendMessage: async (accountId, chatId, text) => { calls.push(`send:${accountId}:${chatId}:${text}`); return { telegramId: 2n, body: text, sentAt: new Date() }; }
      },
      lock: new InMemoryAccountLockRegistry()
    });
    const base = { createdAt: new Date().toISOString(), attempt: 0 } as const;
    const loaded = await handlers.LOAD_MESSAGES({ ...base, id: "load", type: "LOAD_MESSAGES", accountId: "account-1", payload: { chatId: "chat-1", limit: 20 } });
    const sent = await handlers.SEND_MESSAGE({ ...base, id: "send", type: "SEND_MESSAGE", accountId: "account-1", payload: { chatId: "chat-1", text: "hi" } });
    expect(loaded).toEqual({ loaded: 1 });
    expect(sent).toEqual({ telegramId: "2" });
    expect(calls).toEqual(["load:account-1:chat-1", "send:account-1:chat-1:hi"]);
  });
});
