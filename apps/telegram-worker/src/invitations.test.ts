import { describe, expect, it } from "vitest";
import type { WorkerCommandEnvelope } from "@invait/contracts";
import { InMemoryAccountLockRegistry } from "./workers/account-lock.js";
import { createInvitationHandlers } from "./workers/invitations.js";

describe("invitation worker handler", () => {
  it("invites one explicit target under an account lock", async () => {
    const calls: string[] = [];
    const handlers = createInvitationHandlers({ workerId: "worker-a", lock: new InMemoryAccountLockRegistry(), gateway: { inviteUser: async (accountId, chatId, target) => { calls.push(`${accountId}:${chatId}:${target.username}`); } } });
    const command: WorkerCommandEnvelope = { id: "command-a", type: "PROCESS_INVITATION_ITEM", accountId: "account-a", payload: { chatId: "chat-a", username: "alice" }, createdAt: new Date().toISOString(), attempt: 0 };
    const result = await handlers.PROCESS_INVITATION_ITEM(command);
    expect(result).toEqual({ status: "SUCCESS" });
    expect(calls).toEqual(["account-a:chat-a:alice"]);
  });
});
