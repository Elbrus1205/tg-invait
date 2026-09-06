import type { PrismaClient, TelegramAccountStatus } from "@prisma/client";
import type { AccountLifecycleStatus, AccountStatePort } from "./account-lifecycle.js";

/** Worker persistence adapter; it exposes no Prisma details to command handlers. */
export class PrismaAccountStatePort implements AccountStatePort {
  public constructor(private readonly prisma: PrismaClient) {}
  public async setStatus(accountId: string, status: AccountLifecycleStatus, errorState?: string): Promise<void> {
    await this.prisma.telegramAccount.update({
      where: { id: accountId },
      data: {
        status: status as TelegramAccountStatus,
        errorState: errorState ?? null,
        lastActivityAt: new Date(),
        ...(status === "ONLINE" ? { lastOnlineAt: new Date(), sessionStatus: "ACTIVE" } : {}),
        ...(status === "OFFLINE" ? { sessionStatus: "INACTIVE" } : {})
      }
    });
  }
}
