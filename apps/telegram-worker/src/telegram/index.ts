import type { WorkerCommandEnvelope } from "@invait/contracts";

export interface TelegramDialog {
  readonly telegramId: bigint;
  readonly type: "PRIVATE" | "GROUP" | "SUPERGROUP" | "CHANNEL";
  readonly title?: string;
  readonly username?: string;
  readonly avatarUrl?: string;
  readonly lastMessageAt?: Date;
  readonly unreadCount?: number;
  readonly muted?: boolean;
  readonly pinned?: boolean;
}
export interface TelegramMessage { readonly telegramId: bigint; readonly senderId?: bigint; readonly body?: string; readonly mediaType?: string; readonly sentAt: Date; readonly editedAt?: Date; readonly replyToId?: bigint; readonly metadata?: Record<string, unknown>; }
export interface TelegramContact { readonly telegramId: bigint; readonly firstName?: string; readonly lastName?: string; readonly username?: string; readonly phone?: string; readonly source?: string; readonly tags?: readonly string[]; }
export interface TelegramInviteTarget { readonly username?: string; readonly telegramId?: string; readonly accessHash?: string; }

/**
 * Worker-facing Telegram seam. GramJS implements this contract in production;
 * tests can inject a deterministic adapter without Telegram side effects.
 */
export interface TelegramGateway {
  connect(accountId: string, command?: WorkerCommandEnvelope): Promise<"CODE_SENT" | "CONNECTED" | void>;
  disconnect(accountId: string): Promise<void>;
  loadDialogs?(accountId: string): Promise<readonly TelegramDialog[]>;
  loadMessages?(accountId: string, chatId: string, options?: { readonly limit?: number; readonly before?: bigint }): Promise<readonly TelegramMessage[]>;
  sendMessage?(accountId: string, chatId: string, text: string, replyToId?: bigint): Promise<TelegramMessage>;
  loadContacts?(accountId: string): Promise<readonly TelegramContact[]>;
  inviteUser?(accountId: string, chatId: string, target: TelegramInviteTarget): Promise<void>;
}

export class UnconfiguredTelegramGateway implements TelegramGateway {
  public async connect(_accountId: string, _command?: WorkerCommandEnvelope): Promise<"CODE_SENT" | "CONNECTED" | void> {
    throw new Error("telegram_gateway_not_configured");
  }

  public async disconnect(_accountId: string): Promise<void> {
    throw new Error("telegram_gateway_not_configured");
  }
}

export { GramJsTelegramGateway } from "./gramjs-gateway.js";
export type { GramJsTelegramGatewayOptions } from "./gramjs-gateway.js";
