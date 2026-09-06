import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import type { WorkerCommandEnvelope } from "@invait/contracts";
import { Api, TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { Redis } from "ioredis";
import type { BigInteger } from "big-integer";
import type { TelegramContact, TelegramDialog, TelegramGateway, TelegramMessage, TelegramInviteTarget } from "./index.js";

interface AuthAttempt { readonly phone: string; readonly phoneCodeHash: string; readonly session: string; }
interface ConnectPayload { readonly phase?: unknown; readonly phone?: unknown; readonly code?: unknown; readonly encryptedTwoFactorPassword?: unknown; }
export interface GramJsTelegramGatewayOptions { readonly prisma: PrismaClient; readonly redisUrl: string; readonly apiId: number; readonly apiHash: string; readonly encryptionKey: Buffer; readonly authAttemptTtlSeconds?: number; }

function encrypt(value: string, key: Buffer): string { const iv = randomBytes(12); const cipher = createCipheriv("aes-256-gcm", key, iv); const payload = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]); return `${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${payload.toString("base64url")}`; }
function decrypt(value: string, key: Buffer): string { const [iv, tag, payload] = value.split("."); if (!iv || !tag || !payload) throw new Error("encrypted_value_invalid"); const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64url")); decipher.setAuthTag(Buffer.from(tag, "base64url")); return Buffer.concat([decipher.update(Buffer.from(payload, "base64url")), decipher.final()]).toString("utf8"); }
function payloadOf(command: WorkerCommandEnvelope | undefined): ConnectPayload { return command && typeof command.payload === "object" && command.payload !== null ? command.payload as ConnectPayload : {}; }
function rpcMessage(error: unknown): string { return typeof error === "object" && error !== null && "errorMessage" in error && typeof error.errorMessage === "string" ? error.errorMessage : ""; }

export class GramJsTelegramGateway implements TelegramGateway {
  private readonly redis: Redis;
  public constructor(private readonly options: GramJsTelegramGatewayOptions) {
    if (options.encryptionKey.length !== 32) throw new TypeError("Telegram encryption key must contain exactly 32 bytes");
    this.redis = new Redis(options.redisUrl, { lazyConnect: true });
  }
  public async connect(accountId: string, command?: WorkerCommandEnvelope): Promise<"CODE_SENT" | "CONNECTED"> {
    const payload = payloadOf(command);
    if (payload.phase === "request_code") { await this.requestCode(accountId, payload); return "CODE_SENT"; }
    if (payload.phase === "verify_code") { await this.verifyCode(accountId, payload); return "CONNECTED"; }
    const stored = await this.options.prisma.telegramSession.findUnique({ where: { telegramAccountId: accountId } });
    if (!stored) throw new Error("telegram_session_not_found");
    const client = await this.client(accountId, decrypt(stored.encryptedPayload, this.options.encryptionKey));
    try { await client.connect(); return "CONNECTED"; } finally { await client.disconnect(); }
  }
  public async disconnect(accountId: string): Promise<void> {
    const stored = await this.options.prisma.telegramSession.findUnique({ where: { telegramAccountId: accountId } });
    if (!stored) return;
    const client = await this.client(accountId, decrypt(stored.encryptedPayload, this.options.encryptionKey));
    await client.disconnect();
  }
  public async loadDialogs(accountId: string): Promise<readonly TelegramDialog[]> {
    const stored = await this.options.prisma.telegramSession.findUnique({ where: { telegramAccountId: accountId } });
    if (!stored) throw new Error("telegram_session_not_found");
    const client = await this.client(accountId, decrypt(stored.encryptedPayload, this.options.encryptionKey));
    const result: TelegramDialog[] = [];
    try {
      await client.connect();
      for await (const raw of client.iterDialogs({})) {
        const dialog = raw as unknown as { readonly entity?: unknown; readonly unreadCount?: number; readonly pinned?: boolean; readonly message?: { readonly date?: number } };
        const entity = dialog.entity;
        if (entity instanceof Api.User) {
          const title = [entity.firstName, entity.lastName].filter(Boolean).join(" ") || entity.username;
          result.push({ telegramId: BigInt(entity.id.toString()), type: "PRIVATE", ...(title ? { title } : {}), ...(entity.username ? { username: entity.username } : {}), unreadCount: dialog.unreadCount ?? 0, pinned: dialog.pinned ?? false, ...(dialog.message?.date === undefined ? {} : { lastMessageAt: new Date(dialog.message.date * 1000) }) });
        } else if (entity instanceof Api.Chat) {
          result.push({ telegramId: BigInt(entity.id.toString()), type: "GROUP", ...(entity.title ? { title: entity.title } : {}), unreadCount: dialog.unreadCount ?? 0, pinned: dialog.pinned ?? false, ...(dialog.message?.date === undefined ? {} : { lastMessageAt: new Date(dialog.message.date * 1000) }) });
        } else if (entity instanceof Api.Channel) {
          result.push({ telegramId: BigInt(entity.id.toString()), type: entity.megagroup ? "SUPERGROUP" : "CHANNEL", ...(entity.title ? { title: entity.title } : {}), ...(entity.username ? { username: entity.username } : {}), unreadCount: dialog.unreadCount ?? 0, pinned: dialog.pinned ?? false, ...(dialog.message?.date === undefined ? {} : { lastMessageAt: new Date(dialog.message.date * 1000) }) });
        }
      }
      await Promise.all(result.map((chat) => this.options.prisma.chat.upsert({ where: { telegramAccountId_telegramId: { telegramAccountId: accountId, telegramId: chat.telegramId } }, create: { telegramAccountId: accountId, telegramId: chat.telegramId, type: chat.type, ...(chat.title === undefined ? {} : { title: chat.title }), ...(chat.username === undefined ? {} : { username: chat.username }), ...(chat.avatarUrl === undefined ? {} : { avatarUrl: chat.avatarUrl }), ...(chat.lastMessageAt === undefined ? {} : { lastMessageAt: chat.lastMessageAt }), unreadCount: chat.unreadCount ?? 0, muted: chat.muted ?? false, pinned: chat.pinned ?? false }, update: { type: chat.type, ...(chat.title === undefined ? {} : { title: chat.title }), ...(chat.username === undefined ? {} : { username: chat.username }), ...(chat.avatarUrl === undefined ? {} : { avatarUrl: chat.avatarUrl }), ...(chat.lastMessageAt === undefined ? {} : { lastMessageAt: chat.lastMessageAt }), unreadCount: chat.unreadCount ?? 0, muted: chat.muted ?? false, pinned: chat.pinned ?? false } })));
      return result;
    } finally { await client.disconnect(); }
  }
  public async loadMessages(accountId: string, chatId: string, options: { readonly limit?: number; readonly before?: bigint } = {}): Promise<readonly TelegramMessage[]> {
    const [stored, chat] = await Promise.all([this.options.prisma.telegramSession.findUnique({ where: { telegramAccountId: accountId } }), this.options.prisma.chat.findUnique({ where: { id: chatId } })]);
    if (!stored) throw new Error("telegram_session_not_found");
    if (!chat || chat.telegramAccountId !== accountId) throw new Error("chat_not_found");
    const client = await this.client(accountId, decrypt(stored.encryptedPayload, this.options.encryptionKey));
    try {
      await client.connect();
      const rawMessages = await client.getMessages(chat.telegramId.toString(), { limit: Math.min(options.limit ?? 50, 100), ...(options.before === undefined ? {} : { offsetId: Number(options.before) }) });
      const messages = rawMessages.map((raw) => { const value = raw as unknown as { readonly id?: number; readonly senderId?: { toString(): string }; readonly message?: string; readonly date?: number; readonly editDate?: number; readonly replyTo?: { readonly replyToMsgId?: number } }; return { telegramId: BigInt(value.id ?? 0), ...(value.senderId ? { senderId: BigInt(value.senderId.toString()) } : {}), ...(value.message ? { body: value.message } : {}), sentAt: new Date((value.date ?? Math.floor(Date.now() / 1000)) * 1000), ...(value.editDate ? { editedAt: new Date(value.editDate * 1000) } : {}), ...(value.replyTo?.replyToMsgId ? { replyToId: BigInt(value.replyTo.replyToMsgId) } : {}) }; });
      await Promise.all(messages.map((message) => this.options.prisma.messageCache.upsert({ where: { chatId_telegramId: { chatId, telegramId: message.telegramId } }, create: { chatId, telegramId: message.telegramId, ...(message.senderId === undefined ? {} : { senderId: message.senderId }), ...(message.body === undefined ? {} : { body: message.body }), sentAt: message.sentAt, ...(message.editedAt === undefined ? {} : { editedAt: message.editedAt }), ...(message.replyToId === undefined ? {} : { replyToId: message.replyToId }) }, update: { ...(message.senderId === undefined ? {} : { senderId: message.senderId }), ...(message.body === undefined ? {} : { body: message.body }), sentAt: message.sentAt, ...(message.editedAt === undefined ? {} : { editedAt: message.editedAt }), ...(message.replyToId === undefined ? {} : { replyToId: message.replyToId }) } })));
      return messages;
    } finally { await client.disconnect(); }
  }
  public async sendMessage(accountId: string, chatId: string, text: string, replyToId?: bigint): Promise<TelegramMessage> {
    const [stored, chat] = await Promise.all([this.options.prisma.telegramSession.findUnique({ where: { telegramAccountId: accountId } }), this.options.prisma.chat.findUnique({ where: { id: chatId } })]);
    if (!stored) throw new Error("telegram_session_not_found");
    if (!chat || chat.telegramAccountId !== accountId) throw new Error("chat_not_found");
    const client = await this.client(accountId, decrypt(stored.encryptedPayload, this.options.encryptionKey));
    try {
      await client.connect();
      const sent = await client.sendMessage(chat.telegramId.toString(), { message: text, ...(replyToId === undefined ? {} : { replyTo: Number(replyToId) }) });
      const value = sent as unknown as { readonly id?: number; readonly date?: number; readonly message?: string; readonly senderId?: { toString(): string } };
      const message: TelegramMessage = { telegramId: BigInt(value.id ?? 0), body: value.message ?? text, sentAt: new Date((value.date ?? Math.floor(Date.now() / 1000)) * 1000), ...(value.senderId ? { senderId: BigInt(value.senderId.toString()) } : {}), ...(replyToId === undefined ? {} : { replyToId }) };
      await this.options.prisma.messageCache.upsert({ where: { chatId_telegramId: { chatId, telegramId: message.telegramId } }, create: { chatId, telegramId: message.telegramId, ...(message.senderId === undefined ? {} : { senderId: message.senderId }), body: message.body ?? text, sentAt: message.sentAt, ...(message.replyToId === undefined ? {} : { replyToId: message.replyToId }) }, update: { body: message.body ?? text, sentAt: message.sentAt, ...(message.replyToId === undefined ? {} : { replyToId: message.replyToId }) } });
      return message;
    } finally { await client.disconnect(); }
  }
  public async loadContacts(accountId: string): Promise<readonly TelegramContact[]> {
    const stored = await this.options.prisma.telegramSession.findUnique({ where: { telegramAccountId: accountId } });
    if (!stored) throw new Error("telegram_session_not_found");
    const client = await this.client(accountId, decrypt(stored.encryptedPayload, this.options.encryptionKey));
    try {
      await client.connect();
      const contactsResponse = await client.invoke(new Api.contacts.GetContacts({ hash: BigInt(0) as unknown as BigInteger }));
      const users: readonly unknown[] = "users" in contactsResponse && Array.isArray(contactsResponse.users) ? contactsResponse.users : [];
      const contacts = users.filter((user): user is Api.User => user instanceof Api.User).map((user: Api.User) => ({ telegramId: BigInt(user.id.toString()), ...(user.firstName ? { firstName: user.firstName } : {}), ...(user.lastName ? { lastName: user.lastName } : {}), ...(user.username ? { username: user.username } : {}), ...(user.phone ? { phone: user.phone } : {}) }));
      await Promise.all(contacts.map((contact) => this.options.prisma.contact.upsert({ where: { telegramAccountId_telegramId: { telegramAccountId: accountId, telegramId: contact.telegramId } }, create: { telegramAccountId: accountId, telegramId: contact.telegramId, ...(contact.firstName === undefined ? {} : { firstName: contact.firstName }), ...(contact.lastName === undefined ? {} : { lastName: contact.lastName }), ...(contact.username === undefined ? {} : { username: contact.username }), ...(contact.phone === undefined ? {} : { phone: contact.phone }), source: "telegram" }, update: { ...(contact.firstName === undefined ? {} : { firstName: contact.firstName }), ...(contact.lastName === undefined ? {} : { lastName: contact.lastName }), ...(contact.username === undefined ? {} : { username: contact.username }), ...(contact.phone === undefined ? {} : { phone: contact.phone }), source: "telegram" } })));
      return contacts;
    } finally { await client.disconnect(); }
  }
  public async inviteUser(accountId: string, chatId: string, target: TelegramInviteTarget): Promise<void> {
    const stored = await this.options.prisma.telegramSession.findUnique({ where: { telegramAccountId: accountId } });
    if (!stored) throw new Error("telegram_session_not_found");
    if (!target.username && !target.telegramId) throw new Error("invitation_target_invalid");
    const client = await this.client(accountId, decrypt(stored.encryptedPayload, this.options.encryptionKey));
    try {
      await client.connect();
      const channel = await client.getInputEntity(chatId);
      const identifier = target.username ? `@${target.username.replace(/^@/, "")}` : target.telegramId!;
      const user = await client.getInputEntity(identifier);
      await client.invoke(new Api.channels.InviteToChannel({ channel, users: [user] }));
    } finally { await client.disconnect(); }
  }
  public async close(): Promise<void> { if (this.redis.status !== "wait") await this.redis.quit(); }

  private async requestCode(accountId: string, payload: ConnectPayload): Promise<void> {
    if (typeof payload.phone !== "string") throw new Error("phone_required");
    const client = await this.client(accountId, "");
    try {
      await client.connect();
      const result = await client.sendCode({ apiId: this.options.apiId, apiHash: this.options.apiHash }, payload.phone);
      const attempt: AuthAttempt = { phone: payload.phone, phoneCodeHash: result.phoneCodeHash, session: client.session.save() as unknown as string };
      await this.ensureRedis();
      await this.redis.set(`telegram_auth_attempt:${accountId}`, encrypt(JSON.stringify(attempt), this.options.encryptionKey), "EX", this.options.authAttemptTtlSeconds ?? 600);
    } finally { await client.disconnect(); }
  }
  private async verifyCode(accountId: string, payload: ConnectPayload): Promise<void> {
    if (typeof payload.code !== "string") throw new Error("code_required");
    await this.ensureRedis();
    const storedAttempt = await this.redis.get(`telegram_auth_attempt:${accountId}`);
    if (!storedAttempt) throw new Error("telegram_auth_attempt_expired");
    const attempt = JSON.parse(decrypt(storedAttempt, this.options.encryptionKey)) as AuthAttempt;
    const client = await this.client(accountId, attempt.session);
    try {
      await client.connect();
      let user: Api.TypeUser;
      try {
        const authorization = await client.invoke(new Api.auth.SignIn({ phoneNumber: attempt.phone, phoneCodeHash: attempt.phoneCodeHash, phoneCode: payload.code }));
        if (!(authorization instanceof Api.auth.Authorization)) throw new Error("telegram_registration_not_supported");
        user = authorization.user;
      } catch (error) {
        if (rpcMessage(error) !== "SESSION_PASSWORD_NEEDED") throw error;
        if (typeof payload.encryptedTwoFactorPassword !== "string") throw new Error("two_factor_password_required");
        const password = decrypt(payload.encryptedTwoFactorPassword, this.options.encryptionKey);
        user = await client.signInWithPassword({ apiId: this.options.apiId, apiHash: this.options.apiHash }, { password: async () => password, onError: async () => true });
      }
      if (!(user instanceof Api.User)) throw new Error("telegram_profile_unavailable");
      const encryptedPayload = encrypt(client.session.save() as unknown as string, this.options.encryptionKey);
      await this.options.prisma.$transaction([
        this.options.prisma.telegramSession.upsert({ where: { telegramAccountId: accountId }, create: { telegramAccountId: accountId, encryptedPayload }, update: { encryptedPayload } }),
        this.options.prisma.telegramAccount.update({ where: { id: accountId }, data: { telegramId: BigInt(user.id.toString()), username: user.username ?? null, phone: user.phone ?? attempt.phone, firstName: user.firstName ?? null, lastName: user.lastName ?? null, sessionStatus: "ACTIVE", errorState: null } })
      ]);
      await this.redis.del(`telegram_auth_attempt:${accountId}`);
    } finally { await client.disconnect(); }
  }
  private async client(accountId: string, session: string): Promise<TelegramClient> {
    const assignment = await this.options.prisma.accountProxy.findUnique({ where: { telegramAccountId: accountId }, include: { proxy: true } });
    const proxy = assignment?.proxy;
    if (proxy && proxy.protocol !== "SOCKS5") throw new Error("telegram_proxy_protocol_unsupported");
    return new TelegramClient(new StringSession(session), this.options.apiId, this.options.apiHash, {
      connectionRetries: 1, requestRetries: 0, reconnectRetries: 0, autoReconnect: false, floodSleepThreshold: 0,
      ...(proxy ? { proxy: { ip: proxy.host, port: proxy.port, socksType: 5 as const, ...(proxy.encryptedUsername ? { username: decrypt(proxy.encryptedUsername, this.options.encryptionKey) } : {}), ...(proxy.encryptedPassword ? { password: decrypt(proxy.encryptedPassword, this.options.encryptionKey) } : {}) } } : {})
    });
  }
  private async ensureRedis(): Promise<void> { if (this.redis.status === "wait") await this.redis.connect(); }
}
