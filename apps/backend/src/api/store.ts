import { randomUUID } from "node:crypto";

import type { PrismaClient, RoleName, TelegramAccountStatus, ProxyProtocol, ProxyStatus, Prisma, ChatType, TaskStatus, TaskType, LogLevel, LogType } from "@prisma/client";

export interface StoredUser {
  readonly id: string;
  readonly email: string;
  readonly name: string | null;
  readonly passwordHash: string;
  readonly roles: readonly RoleName[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface StoredSession {
  readonly id: string;
  readonly userId: string;
  readonly tokenHash: string;
  readonly expiresAt: Date;
  readonly revokedAt: Date | null;
}

export interface StoredResetToken {
  readonly tokenHash: string;
  readonly userId: string;
  readonly expiresAt: Date;
  readonly usedAt: Date | null;
}

export interface StoredAccount {
  readonly id: string;
  readonly ownerId: string | null;
  readonly telegramId: bigint | null;
  readonly username: string | null;
  readonly phone: string | null;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly avatarUrl: string | null;
  readonly status: TelegramAccountStatus;
  readonly lastOnlineAt: Date | null;
  readonly lastActivityAt: Date | null;
  readonly sessionStatus: string | null;
  readonly errorState: string | null;
  readonly proxyId: string | null;
}

export interface StoredProxy {
  readonly id: string;
  readonly name: string;
  readonly host: string;
  readonly port: number;
  readonly protocol: ProxyProtocol;
  readonly encryptedUsername: string | null;
  readonly encryptedPassword: string | null;
  readonly country: string | null;
  readonly pingMs: number | null;
  readonly status: ProxyStatus;
  readonly lastCheckedAt: Date | null;
  readonly errorCode: string | null;
  readonly disabledAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface StoredChat {
  readonly id: string;
  readonly telegramAccountId: string;
  readonly telegramId: bigint;
  readonly type: ChatType;
  readonly title: string | null;
  readonly username: string | null;
  readonly avatarUrl: string | null;
  readonly lastMessageAt: Date | null;
  readonly unreadCount: number;
  readonly muted: boolean;
  readonly pinned: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CreateChatInput {
  readonly telegramAccountId: string;
  readonly telegramId: bigint | string;
  readonly type: ChatType;
  readonly title?: string;
  readonly username?: string;
  readonly avatarUrl?: string;
  readonly lastMessageAt?: Date;
  readonly unreadCount?: number;
  readonly muted?: boolean;
  readonly pinned?: boolean;
}
export interface StoredMessage { readonly id: string; readonly chatId: string; readonly telegramId: bigint; readonly senderId: bigint | null; readonly body: string | null; readonly mediaType: string | null; readonly sentAt: Date; readonly editedAt: Date | null; readonly replyToId: bigint | null; readonly metadata: Prisma.JsonValue | null; }
export interface CreateMessageInput { readonly chatId: string; readonly telegramId: bigint | string; readonly senderId?: bigint | string; readonly body?: string; readonly mediaType?: string; readonly sentAt: Date; readonly editedAt?: Date; readonly replyToId?: bigint | string; readonly metadata?: Prisma.InputJsonValue; }
export interface StoredContact { readonly id: string; readonly telegramAccountId: string; readonly telegramId: bigint; readonly firstName: string | null; readonly lastName: string | null; readonly username: string | null; readonly phone: string | null; readonly source: string | null; readonly notes: string | null; readonly tags: readonly string[]; readonly createdAt: Date; readonly updatedAt: Date; }
export interface CreateContactInput { readonly telegramAccountId: string; readonly telegramId: bigint | string; readonly firstName?: string; readonly lastName?: string; readonly username?: string; readonly phone?: string; readonly source?: string; readonly notes?: string; readonly tags?: readonly string[]; }
export interface StoredTask { readonly id: string; readonly createdById: string | null; readonly name: string; readonly type: TaskType; readonly status: TaskStatus; readonly target: Prisma.JsonValue | null; readonly source: Prisma.JsonValue | null; readonly progress: Prisma.JsonValue | null; readonly error: string | null; readonly startedAt: Date | null; readonly completedAt: Date | null; readonly createdAt: Date; readonly updatedAt: Date; readonly accountIds: readonly string[]; }
export interface CreateTaskInput { readonly createdById: string; readonly name: string; readonly type: TaskType; readonly target?: Prisma.InputJsonValue; readonly source?: Prisma.InputJsonValue; readonly accountIds?: readonly string[]; }
export interface UpdateTaskInput { readonly status?: TaskStatus; readonly error?: string | null; readonly progress?: Prisma.InputJsonValue; readonly startedAt?: Date | null; readonly completedAt?: Date | null; }
export interface StoredInvitationTask { readonly id: string; readonly createdById: string | null; readonly name: string; readonly status: TaskStatus; readonly target: Prisma.JsonValue; readonly scheduleAt: Date | null; readonly notes: string | null; readonly accountIds: readonly string[]; readonly userCount: number; readonly createdAt: Date; readonly updatedAt: Date; }
export interface CreateInvitationTaskInput { readonly createdById: string; readonly name: string; readonly target: Prisma.InputJsonValue; readonly accountIds: readonly string[]; readonly scheduleAt?: Date; readonly notes?: string; }
export interface InvitationImportInput { readonly invitationTaskId: string; readonly uploadedById: string; readonly filename: string; readonly rows: readonly { readonly username: string; readonly telegramId?: string; readonly accessHash?: string; readonly firstName?: string; readonly lastName?: string; readonly note?: string; readonly tag?: string; readonly source?: string }[]; readonly totalRows: number; readonly validRows: number; readonly invalidRows: number; readonly duplicateRows: number; }
export interface StoredInvitationImport { readonly id: string; readonly invitationTaskId: string; readonly uploadedById: string; readonly filename: string; readonly totalRows: number; readonly validRows: number; readonly invalidRows: number; readonly duplicateRows: number; readonly createdAt: Date; }
export interface StoredLog { readonly id: string; readonly type: LogType; readonly level: LogLevel; readonly telegramAccountId: string | null; readonly proxyId: string | null; readonly workerId: string | null; readonly taskId: string | null; readonly action: string; readonly description: string; readonly errorCode: string | null; readonly metadata: Prisma.JsonValue | null; readonly createdAt: Date; }
export interface StoredAuditLog { readonly id: string; readonly actorId: string | null; readonly role: string | null; readonly ipAddress: string | null; readonly action: string; readonly entity: string; readonly entityId: string | null; readonly before: Prisma.JsonValue | null; readonly after: Prisma.JsonValue | null; readonly metadata: Prisma.JsonValue | null; readonly createdAt: Date; }
export interface CreateLogInput { readonly type: LogType; readonly level: LogLevel; readonly telegramAccountId?: string; readonly proxyId?: string; readonly workerId?: string; readonly taskId?: string; readonly action: string; readonly description: string; readonly errorCode?: string; readonly metadata?: Prisma.InputJsonValue; }
export interface CreateAuditLogInput { readonly actorId?: string; readonly role?: string; readonly ipAddress?: string; readonly action: string; readonly entity: string; readonly entityId?: string; readonly before?: Prisma.InputJsonValue; readonly after?: Prisma.InputJsonValue; readonly metadata?: Prisma.InputJsonValue; }

export interface CreateUserInput { readonly email: string; readonly name?: string | undefined; readonly passwordHash: string; readonly role: RoleName; }
export interface CreateAccountInput { readonly ownerId: string; readonly telegramId?: bigint | string | undefined; readonly username?: string | undefined; readonly phone?: string | undefined; readonly firstName?: string | undefined; readonly lastName?: string | undefined; readonly avatarUrl?: string | undefined; readonly proxyId?: string | undefined; }
export interface UpdateAccountInput { readonly status?: TelegramAccountStatus; readonly username?: string; readonly phone?: string; readonly firstName?: string; readonly lastName?: string; readonly avatarUrl?: string; readonly proxyId?: string | null; }
export interface CreateProxyInput { readonly name: string; readonly host: string; readonly port: number; readonly protocol: ProxyProtocol; readonly username?: string | undefined; readonly password?: string | undefined; readonly encryptedUsername?: string | undefined; readonly encryptedPassword?: string | undefined; readonly country?: string | undefined; }
export interface UpdateProxyInput { readonly name?: string | undefined; readonly host?: string | undefined; readonly port?: number | undefined; readonly protocol?: ProxyProtocol | undefined; readonly username?: string | undefined; readonly password?: string | undefined; readonly encryptedUsername?: string | null | undefined; readonly encryptedPassword?: string | null | undefined; readonly country?: string | null | undefined; readonly status?: ProxyStatus | undefined; readonly pingMs?: number | null | undefined; readonly errorCode?: string | null | undefined; readonly lastCheckedAt?: Date | null | undefined; readonly disabledAt?: Date | null | undefined; }
type PrismaUserWithRoles = { readonly id: string; readonly email: string; readonly name: string | null; readonly passwordHash: string; readonly createdAt: Date; readonly updatedAt: Date; readonly roles: readonly { readonly role: { readonly name: RoleName } }[] };

export interface ApiStore {
  countUsers(): Promise<number>;
  findUserByEmail(email: string): Promise<StoredUser | undefined>;
  findUserById(id: string): Promise<StoredUser | undefined>;
  listUsers(): Promise<readonly StoredUser[]>;
  createUser(input: CreateUserInput): Promise<StoredUser>;
  updateUser(id: string, input: { readonly name?: string | null; readonly role?: RoleName }): Promise<StoredUser>;
  deleteUser(id: string): Promise<void>;
  updateUserPassword(userId: string, passwordHash: string): Promise<void>;
  createSession(userId: string, tokenHash: string, expiresAt: Date): Promise<StoredSession>;
  findSession(tokenHash: string): Promise<StoredSession | undefined>;
  revokeSession(id: string): Promise<void>;
  revokeSessionsForUser(userId: string): Promise<void>;
  listSessions(userId: string): Promise<readonly StoredSession[]>;
  createResetToken(tokenHash: string, userId: string, expiresAt: Date): Promise<void>;
  findResetToken(tokenHash: string): Promise<StoredResetToken | undefined>;
  consumeResetToken(tokenHash: string): Promise<void>;
  createAccount(input: CreateAccountInput): Promise<StoredAccount>;
  findAccount(id: string | undefined): Promise<StoredAccount | undefined>;
  listAccounts(ownerId: string): Promise<readonly StoredAccount[]>;
  updateAccount(id: string, input: UpdateAccountInput): Promise<StoredAccount>;
  createProxy(input: CreateProxyInput): Promise<StoredProxy>;
  findProxy(id: string | undefined): Promise<StoredProxy | undefined>;
  listProxies(): Promise<readonly StoredProxy[]>;
  updateProxy(id: string, input: UpdateProxyInput): Promise<StoredProxy>;
  deleteProxy(id: string): Promise<void>;
  inspectProxy(id: string): StoredProxy | undefined;
  createChat(input: CreateChatInput): Promise<StoredChat>;
  listChats(ownerId: string, options?: { readonly accountId?: string; readonly type?: ChatType; readonly search?: string }): Promise<readonly StoredChat[]>;
  findChat(id: string): Promise<StoredChat | undefined>;
  listMessages(chatId: string, options?: { readonly limit?: number; readonly before?: bigint }): Promise<readonly StoredMessage[]>;
  createMessage(input: CreateMessageInput): Promise<StoredMessage>;
  createContact(input: CreateContactInput): Promise<StoredContact>;
  listContacts(ownerId: string, options?: { readonly accountId?: string; readonly search?: string; readonly limit?: number; readonly before?: bigint }): Promise<readonly StoredContact[]>;
  createTask(input: CreateTaskInput): Promise<StoredTask>;
  findTask(id: string): Promise<StoredTask | undefined>;
  listTasks(ownerId: string, options?: { readonly status?: TaskStatus }): Promise<readonly StoredTask[]>;
  updateTask(id: string, input: UpdateTaskInput): Promise<StoredTask>;
  createInvitationTask(input: CreateInvitationTaskInput): Promise<StoredInvitationTask>;
  findInvitationTask(id: string): Promise<StoredInvitationTask | undefined>;
  listInvitationTasks(ownerId: string): Promise<readonly StoredInvitationTask[]>;
  createInvitationImport(input: InvitationImportInput): Promise<StoredInvitationImport>;
  listInvitationImports(ownerId: string): Promise<readonly StoredInvitationImport[]>;
  createLog(input: CreateLogInput): Promise<StoredLog>;
  listLogs(ownerId: string, options?: { readonly type?: LogType; readonly level?: LogLevel; readonly accountId?: string; readonly taskId?: string; readonly search?: string; readonly limit?: number; readonly before?: Date }): Promise<readonly StoredLog[]>;
  createAuditLog(input: CreateAuditLogInput): Promise<StoredAuditLog>;
  listAuditLogs(ownerId: string, options?: { readonly search?: string; readonly entity?: string; readonly limit?: number; readonly before?: Date }): Promise<readonly StoredAuditLog[]>;
}

export class InMemoryApiStore implements ApiStore {
  private readonly users = new Map<string, StoredUser>();
  private readonly sessions = new Map<string, StoredSession>();
  private readonly resetTokens = new Map<string, StoredResetToken>();
  private readonly accounts = new Map<string, StoredAccount>();
  private readonly proxies = new Map<string, StoredProxy>();
  private readonly chats = new Map<string, StoredChat>();
  private readonly messages = new Map<string, StoredMessage>();
  private readonly contacts = new Map<string, StoredContact>();
  private readonly tasks = new Map<string, StoredTask>();
  private readonly invitationTasks = new Map<string, StoredInvitationTask>();
  private readonly invitationImports = new Map<string, StoredInvitationImport>();
  private readonly logs = new Map<string, StoredLog>();
  private readonly auditLogs = new Map<string, StoredAuditLog>();

  public async countUsers(): Promise<number> { return this.users.size; }
  public async findUserByEmail(email: string): Promise<StoredUser | undefined> { return [...this.users.values()].find((u) => u.email === email); }
  public async findUserById(id: string): Promise<StoredUser | undefined> { return this.users.get(id); }
  public async listUsers(): Promise<readonly StoredUser[]> { return [...this.users.values()]; }
  public async createUser(input: CreateUserInput): Promise<StoredUser> {
    if (await this.findUserByEmail(input.email)) throw new Error("USER_EMAIL_EXISTS");
    const now = new Date();
    const user: StoredUser = { id: randomUUID(), email: input.email, name: input.name ?? null, passwordHash: input.passwordHash, roles: [input.role], createdAt: now, updatedAt: now };
    this.users.set(user.id, user); return user;
  }
  public async updateUserPassword(userId: string, passwordHash: string): Promise<void> { const user = this.users.get(userId); if (user) this.users.set(userId, { ...user, passwordHash, updatedAt: new Date() }); }
  public async updateUser(id: string, input: { readonly name?: string | null; readonly role?: RoleName }): Promise<StoredUser> { const user = this.users.get(id); if (!user) throw new Error("USER_NOT_FOUND"); const updated = { ...user, ...(input.name === undefined ? {} : { name: input.name }), ...(input.role === undefined ? {} : { roles: [input.role] }), updatedAt: new Date() }; this.users.set(id, updated); return updated; }
  public async deleteUser(id: string): Promise<void> { this.users.delete(id); }
  public async createSession(userId: string, tokenHash: string, expiresAt: Date): Promise<StoredSession> { const session = { id: randomUUID(), userId, tokenHash, expiresAt, revokedAt: null }; this.sessions.set(session.id, session); return session; }
  public async findSession(tokenHash: string): Promise<StoredSession | undefined> { return [...this.sessions.values()].find((s) => s.tokenHash === tokenHash); }
  public async revokeSession(id: string): Promise<void> { const s = this.sessions.get(id); if (s) this.sessions.set(id, { ...s, revokedAt: new Date() }); }
  public async revokeSessionsForUser(userId: string): Promise<void> { for (const s of this.sessions.values()) if (s.userId === userId && !s.revokedAt) await this.revokeSession(s.id); }
  public async listSessions(userId: string): Promise<readonly StoredSession[]> { return [...this.sessions.values()].filter((s) => s.userId === userId); }
  public async createResetToken(tokenHash: string, userId: string, expiresAt: Date): Promise<void> { this.resetTokens.set(tokenHash, { tokenHash, userId, expiresAt, usedAt: null }); }
  public async findResetToken(tokenHash: string): Promise<StoredResetToken | undefined> { return this.resetTokens.get(tokenHash); }
  public async consumeResetToken(tokenHash: string): Promise<void> { const t = this.resetTokens.get(tokenHash); if (t) this.resetTokens.set(tokenHash, { ...t, usedAt: new Date() }); }
  public async createAccount(input: CreateAccountInput): Promise<StoredAccount> { const account: StoredAccount = { id: randomUUID(), ownerId: input.ownerId, telegramId: input.telegramId === undefined ? null : BigInt(input.telegramId), username: input.username ?? null, phone: input.phone ?? null, firstName: input.firstName ?? null, lastName: input.lastName ?? null, avatarUrl: input.avatarUrl ?? null, status: "OFFLINE", lastOnlineAt: null, lastActivityAt: null, sessionStatus: null, errorState: null, proxyId: input.proxyId ?? null }; this.accounts.set(account.id, account); return account; }
  public async findAccount(id: string | undefined): Promise<StoredAccount | undefined> { return id === undefined ? undefined : this.accounts.get(id); }
  public async listAccounts(ownerId: string): Promise<readonly StoredAccount[]> { return [...this.accounts.values()].filter((a) => a.ownerId === ownerId); }
  public async updateAccount(id: string, input: UpdateAccountInput): Promise<StoredAccount> { const current = this.accounts.get(id); if (!current) throw new Error("ACCOUNT_NOT_FOUND"); const updated = { ...current, ...input }; this.accounts.set(id, updated); return updated; }
  public async createProxy(input: CreateProxyInput): Promise<StoredProxy> { if ([...this.proxies.values()].some((p) => p.host === input.host && p.port === input.port && p.protocol === input.protocol)) throw new Error("PROXY_EXISTS"); const now = new Date(); const proxy: StoredProxy = { id: randomUUID(), name: input.name, host: input.host, port: input.port, protocol: input.protocol, encryptedUsername: input.encryptedUsername ?? null, encryptedPassword: input.encryptedPassword ?? null, country: input.country ?? null, pingMs: null, status: "UNKNOWN", lastCheckedAt: null, errorCode: null, disabledAt: null, createdAt: now, updatedAt: now }; this.proxies.set(proxy.id, proxy); return proxy; }
  public async findProxy(id: string | undefined): Promise<StoredProxy | undefined> { return id === undefined ? undefined : this.proxies.get(id); }
  public async listProxies(): Promise<readonly StoredProxy[]> { return [...this.proxies.values()]; }
  public async updateProxy(id: string, input: UpdateProxyInput): Promise<StoredProxy> { const current = this.proxies.get(id); if (!current) throw new Error("PROXY_NOT_FOUND"); const updated: StoredProxy = { ...current, ...(input.name === undefined ? {} : { name: input.name }), ...(input.host === undefined ? {} : { host: input.host }), ...(input.port === undefined ? {} : { port: input.port }), ...(input.protocol === undefined ? {} : { protocol: input.protocol }), ...(input.encryptedUsername === undefined ? {} : { encryptedUsername: input.encryptedUsername }), ...(input.encryptedPassword === undefined ? {} : { encryptedPassword: input.encryptedPassword }), ...(input.country === undefined ? {} : { country: input.country }), ...(input.status === undefined ? {} : { status: input.status }), ...(input.pingMs === undefined ? {} : { pingMs: input.pingMs }), ...(input.errorCode === undefined ? {} : { errorCode: input.errorCode }), ...(input.lastCheckedAt === undefined ? {} : { lastCheckedAt: input.lastCheckedAt }), ...(input.disabledAt === undefined ? {} : { disabledAt: input.disabledAt }), updatedAt: new Date() }; this.proxies.set(id, updated); return updated; }
  public async deleteProxy(id: string): Promise<void> { this.proxies.delete(id); }
  public inspectProxy(id: string): StoredProxy | undefined { return this.proxies.get(id); }
  public async createChat(input: CreateChatInput): Promise<StoredChat> {
    const existing = [...this.chats.values()].find((chat) => chat.telegramAccountId === input.telegramAccountId && chat.telegramId === BigInt(input.telegramId));
    const now = new Date();
    const chat: StoredChat = {
      id: existing?.id ?? randomUUID(), telegramAccountId: input.telegramAccountId, telegramId: BigInt(input.telegramId), type: input.type,
      title: input.title ?? null, username: input.username ?? null, avatarUrl: input.avatarUrl ?? null, lastMessageAt: input.lastMessageAt ?? null,
      unreadCount: input.unreadCount ?? 0, muted: input.muted ?? false, pinned: input.pinned ?? false, createdAt: existing?.createdAt ?? now, updatedAt: now
    };
    this.chats.set(chat.id, chat); return chat;
  }
  public async listChats(ownerId: string, options: { readonly accountId?: string; readonly type?: ChatType; readonly search?: string } = {}): Promise<readonly StoredChat[]> {
    const owned = new Set((await this.listAccounts(ownerId)).map((account) => account.id));
    const search = options.search?.toLowerCase();
    return [...this.chats.values()].filter((chat) => owned.has(chat.telegramAccountId) && (options.accountId === undefined || chat.telegramAccountId === options.accountId) && (options.type === undefined || chat.type === options.type) && (search === undefined || `${chat.title ?? ""} ${chat.username ?? ""} ${chat.telegramId}`.toLowerCase().includes(search)));
  }
  public async findChat(id: string): Promise<StoredChat | undefined> { return this.chats.get(id); }
  public async listMessages(chatId: string, options: { readonly limit?: number; readonly before?: bigint } = {}): Promise<readonly StoredMessage[]> {
    const values = [...this.messages.values()].filter((message) => message.chatId === chatId && (options.before === undefined || message.telegramId < options.before)).sort((a, b) => Number(b.sentAt) - Number(a.sentAt));
    return values.slice(0, Math.min(options.limit ?? 50, 100));
  }
  public async createMessage(input: CreateMessageInput): Promise<StoredMessage> {
    const existing = [...this.messages.values()].find((message) => message.chatId === input.chatId && message.telegramId === BigInt(input.telegramId));
    const message: StoredMessage = { id: existing?.id ?? randomUUID(), chatId: input.chatId, telegramId: BigInt(input.telegramId), senderId: input.senderId === undefined ? null : BigInt(input.senderId), body: input.body ?? null, mediaType: input.mediaType ?? null, sentAt: input.sentAt, editedAt: input.editedAt ?? null, replyToId: input.replyToId === undefined ? null : BigInt(input.replyToId), metadata: input.metadata === undefined ? null : input.metadata as Prisma.JsonValue };
    this.messages.set(message.id, message); return message;
  }
  public async createContact(input: CreateContactInput): Promise<StoredContact> { const existing = [...this.contacts.values()].find((contact) => contact.telegramAccountId === input.telegramAccountId && contact.telegramId === BigInt(input.telegramId)); const now = new Date(); const contact: StoredContact = { id: existing?.id ?? randomUUID(), telegramAccountId: input.telegramAccountId, telegramId: BigInt(input.telegramId), firstName: input.firstName ?? null, lastName: input.lastName ?? null, username: input.username ?? null, phone: input.phone ?? null, source: input.source ?? null, notes: input.notes ?? null, tags: input.tags ?? [], createdAt: existing?.createdAt ?? now, updatedAt: now }; this.contacts.set(contact.id, contact); return contact; }
  public async listContacts(ownerId: string, options: { readonly accountId?: string; readonly search?: string; readonly limit?: number; readonly before?: bigint } = {}): Promise<readonly StoredContact[]> { const owned = new Set((await this.listAccounts(ownerId)).map((account) => account.id)); const search = options.search?.toLowerCase(); return [...this.contacts.values()].filter((contact) => owned.has(contact.telegramAccountId) && (options.accountId === undefined || contact.telegramAccountId === options.accountId) && (options.before === undefined || contact.telegramId < options.before) && (search === undefined || `${contact.firstName ?? ""} ${contact.lastName ?? ""} ${contact.username ?? ""} ${contact.phone ?? ""} ${contact.telegramId}`.toLowerCase().includes(search))).slice(0, Math.min(options.limit ?? 50, 100)); }
  public async createTask(input: CreateTaskInput): Promise<StoredTask> { const now = new Date(); const task: StoredTask = { id: randomUUID(), createdById: input.createdById, name: input.name, type: input.type, status: "DRAFT", target: input.target === undefined ? null : input.target as Prisma.JsonValue, source: input.source === undefined ? null : input.source as Prisma.JsonValue, progress: null, error: null, startedAt: null, completedAt: null, createdAt: now, updatedAt: now, accountIds: [...(input.accountIds ?? [])] }; this.tasks.set(task.id, task); return task; }
  public async findTask(id: string) { return this.tasks.get(id); }
  public async listTasks(ownerId: string, options: { readonly status?: TaskStatus } = {}) { return [...this.tasks.values()].filter((task) => task.createdById === ownerId && (options.status === undefined || task.status === options.status)); }
  public async updateTask(id: string, input: UpdateTaskInput) { const current = this.tasks.get(id); if (!current) throw new Error("TASK_NOT_FOUND"); const updated = { ...current, ...input, ...(input.progress === undefined ? {} : { progress: input.progress as Prisma.JsonValue }), updatedAt: new Date() } as StoredTask; this.tasks.set(id, updated); return updated; }
  public async createInvitationTask(input: CreateInvitationTaskInput): Promise<StoredInvitationTask> { const now = new Date(); const task: StoredInvitationTask = { id: randomUUID(), createdById: input.createdById, name: input.name, status: "DRAFT", target: input.target as Prisma.JsonValue, scheduleAt: input.scheduleAt ?? null, notes: input.notes ?? null, accountIds: [...input.accountIds], userCount: 0, createdAt: now, updatedAt: now }; this.invitationTasks.set(task.id, task); return task; }
  public async findInvitationTask(id: string) { return this.invitationTasks.get(id); }
  public async listInvitationTasks(ownerId: string) { return [...this.invitationTasks.values()].filter((task) => task.createdById === ownerId); }
  public async createInvitationImport(input: InvitationImportInput): Promise<StoredInvitationImport> { const now = new Date(); const value: StoredInvitationImport = { id: randomUUID(), invitationTaskId: input.invitationTaskId, uploadedById: input.uploadedById, filename: input.filename, totalRows: input.totalRows, validRows: input.validRows, invalidRows: input.invalidRows, duplicateRows: input.duplicateRows, createdAt: now }; this.invitationImports.set(value.id, value); const task = this.invitationTasks.get(input.invitationTaskId); if (task) this.invitationTasks.set(task.id, { ...task, userCount: task.userCount + input.rows.length, updatedAt: now }); return value; }
  public async listInvitationImports(ownerId: string) { const owned = new Set((await this.listInvitationTasks(ownerId)).map((task) => task.id)); return [...this.invitationImports.values()].filter((item) => owned.has(item.invitationTaskId)); }
  public async createLog(input: CreateLogInput): Promise<StoredLog> { const value: StoredLog = { id: randomUUID(), type: input.type, level: input.level, telegramAccountId: input.telegramAccountId ?? null, proxyId: input.proxyId ?? null, workerId: input.workerId ?? null, taskId: input.taskId ?? null, action: input.action, description: input.description, errorCode: input.errorCode ?? null, metadata: (input.metadata as Prisma.JsonValue | undefined) ?? null, createdAt: new Date() }; this.logs.set(value.id, value); return value; }
  public async listLogs(ownerId: string, options: { readonly type?: LogType; readonly level?: LogLevel; readonly accountId?: string; readonly taskId?: string; readonly search?: string; readonly limit?: number; readonly before?: Date } = {}): Promise<readonly StoredLog[]> { const ownedAccounts = new Set((await this.listAccounts(ownerId)).map((a) => a.id)); const ownedTasks = new Set((await this.listTasks(ownerId)).map((t) => t.id)); const search = options.search?.toLowerCase(); return [...this.logs.values()].filter((l) => (!l.telegramAccountId || ownedAccounts.has(l.telegramAccountId)) && (!l.taskId || ownedTasks.has(l.taskId)) && (!options.type || l.type === options.type) && (!options.level || l.level === options.level) && (!options.accountId || l.telegramAccountId === options.accountId) && (!options.taskId || l.taskId === options.taskId) && (!search || `${l.action} ${l.description} ${l.errorCode ?? ""}`.toLowerCase().includes(search)) && (!options.before || l.createdAt < options.before)).sort((a,b) => b.createdAt.getTime()-a.createdAt.getTime()).slice(0, Math.min(options.limit ?? 50, 100)); }
  public async createAuditLog(input: CreateAuditLogInput): Promise<StoredAuditLog> { const value: StoredAuditLog = { id: randomUUID(), actorId: input.actorId ?? null, role: input.role ?? null, ipAddress: input.ipAddress ?? null, action: input.action, entity: input.entity, entityId: input.entityId ?? null, before: (input.before as Prisma.JsonValue | undefined) ?? null, after: (input.after as Prisma.JsonValue | undefined) ?? null, metadata: (input.metadata as Prisma.JsonValue | undefined) ?? null, createdAt: new Date() }; this.auditLogs.set(value.id, value); return value; }
  public async listAuditLogs(ownerId: string, options: { readonly search?: string; readonly entity?: string; readonly limit?: number; readonly before?: Date } = {}): Promise<readonly StoredAuditLog[]> { const search = options.search?.toLowerCase(); return [...this.auditLogs.values()].filter((a) => (!a.actorId || a.actorId === ownerId) && (!options.entity || a.entity === options.entity) && (!search || `${a.action} ${a.entity} ${a.entityId ?? ""}`.toLowerCase().includes(search)) && (!options.before || a.createdAt < options.before)).sort((a,b) => b.createdAt.getTime()-a.createdAt.getTime()).slice(0, Math.min(options.limit ?? 50, 100)); }
}

/** Prisma adapter. It is intentionally persistence-only; authentication and HTTP remain above this seam. */
export class PrismaApiStore implements ApiStore {
  public constructor(private readonly db: PrismaClient) {}
  private userSelect = { id: true, email: true, name: true, passwordHash: true, createdAt: true, updatedAt: true, roles: { include: { role: true } } } as const;
  private mapUser(value: PrismaUserWithRoles): StoredUser { return { id: value.id, email: value.email, name: value.name, passwordHash: value.passwordHash, createdAt: value.createdAt, updatedAt: value.updatedAt, roles: value.roles.map((r) => r.role.name) }; }
  public async countUsers() { return this.db.user.count(); }
  public async findUserByEmail(email: string) { const v = await this.db.user.findUnique({ where: { email }, select: this.userSelect }); return v ? this.mapUser(v) : undefined; }
  public async findUserById(id: string) { const v = await this.db.user.findUnique({ where: { id }, select: this.userSelect }); return v ? this.mapUser(v) : undefined; }
  public async listUsers() { const values = await this.db.user.findMany({ select: this.userSelect }); return values.map((v) => this.mapUser(v)); }
  public async createUser(i: CreateUserInput) { const v = await this.db.user.create({ data: { email: i.email, ...(i.name === undefined ? {} : { name: i.name }), passwordHash: i.passwordHash, roles: { create: { role: { connectOrCreate: { where: { name: i.role }, create: { name: i.role } } } } } }, select: this.userSelect }); return this.mapUser(v); }
  public async updateUserPassword(userId: string, passwordHash: string) { await this.db.user.update({ where: { id: userId }, data: { passwordHash } }); }
  public async updateUser(id: string, input: { readonly name?: string | null; readonly role?: RoleName }) { const v = await this.db.user.update({ where: { id }, data: { ...(input.name === undefined ? {} : { name: input.name }), ...(input.role === undefined ? {} : { roles: { deleteMany: {}, create: { role: { connectOrCreate: { where: { name: input.role }, create: { name: input.role } } } } } }) }, select: this.userSelect }); return this.mapUser(v); }
  public async deleteUser(id: string) { await this.db.user.delete({ where: { id } }); }
  public async createSession(userId: string, tokenHash: string, expiresAt: Date) { return this.db.userSession.create({ data: { userId, tokenHash, expiresAt } }); }
  public async findSession(tokenHash: string) { const value = await this.db.userSession.findUnique({ where: { tokenHash } }); return value ?? undefined; }
  public async revokeSession(id: string) { await this.db.userSession.update({ where: { id }, data: { revokedAt: new Date() } }); }
  public async revokeSessionsForUser(userId: string) { await this.db.userSession.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } }); }
  public async listSessions(userId: string) { return this.db.userSession.findMany({ where: { userId } }); }
  public async createResetToken(tokenHash: string, userId: string, expiresAt: Date) { await this.db.passwordResetToken.create({ data: { tokenHash, userId, expiresAt } }); }
  public async findResetToken(tokenHash: string) { const value = await this.db.passwordResetToken.findUnique({ where: { tokenHash } }); return value ?? undefined; }
  public async consumeResetToken(tokenHash: string) { await this.db.passwordResetToken.update({ where: { tokenHash }, data: { usedAt: new Date() } }); }
  public async createAccount(i: CreateAccountInput) { const v = await this.db.telegramAccount.create({ data: { owner: { connect: { id: i.ownerId } }, ...(i.telegramId === undefined ? {} : { telegramId: BigInt(i.telegramId) }), ...(i.username === undefined ? {} : { username: i.username }), ...(i.phone === undefined ? {} : { phone: i.phone }), ...(i.firstName === undefined ? {} : { firstName: i.firstName }), ...(i.lastName === undefined ? {} : { lastName: i.lastName }), ...(i.avatarUrl === undefined ? {} : { avatarUrl: i.avatarUrl }), ...(i.proxyId === undefined ? {} : { proxyAssignment: { create: { proxy: { connect: { id: i.proxyId } } } } }) }, include: { proxyAssignment: true } }); return { ...v, proxyId: v.proxyAssignment?.proxyId ?? null } as StoredAccount; }
  public async findAccount(id: string | undefined) { if (id === undefined) return undefined; const v = await this.db.telegramAccount.findUnique({ where: { id }, include: { proxyAssignment: true } }); return v ? ({ ...v, proxyId: v.proxyAssignment?.proxyId ?? null } as StoredAccount) : undefined; }
  public async listAccounts(ownerId: string) { const values = await this.db.telegramAccount.findMany({ where: { ownerId }, include: { proxyAssignment: true } }); return values.map((v) => ({ ...v, proxyId: v.proxyAssignment?.proxyId ?? null } as StoredAccount)); }
  public async updateAccount(id: string, i: UpdateAccountInput) { const { proxyId, ...fields } = i; const v = await this.db.telegramAccount.update({ where: { id }, data: fields, include: { proxyAssignment: true } }); if (proxyId !== undefined) { if (proxyId === null) await this.db.accountProxy.deleteMany({ where: { telegramAccountId: id } }); else await this.db.accountProxy.upsert({ where: { telegramAccountId: id }, create: { telegramAccountId: id, proxyId }, update: { proxyId } }); } return { ...v, proxyId: proxyId ?? v.proxyAssignment?.proxyId ?? null } as StoredAccount; }
  public async createProxy(i: CreateProxyInput) { const data = { name: i.name, host: i.host, port: i.port, protocol: i.protocol, ...(i.encryptedUsername === undefined ? {} : { encryptedUsername: i.encryptedUsername }), ...(i.encryptedPassword === undefined ? {} : { encryptedPassword: i.encryptedPassword }), ...(i.country === undefined ? {} : { country: i.country }) }; return this.db.proxy.create({ data }) as Promise<StoredProxy>; }
  public async findProxy(id: string | undefined) { if (id === undefined) return undefined; return this.db.proxy.findUnique({ where: { id } }) as Promise<StoredProxy | undefined>; }
  public async listProxies() { return this.db.proxy.findMany() as Promise<readonly StoredProxy[]>; }
  public async updateProxy(id: string, input: UpdateProxyInput) { const { username: _username, password: _password, ...data } = input; return this.db.proxy.update({ where: { id }, data: data as Prisma.ProxyUpdateInput }) as Promise<StoredProxy>; }
  public async deleteProxy(id: string) { await this.db.proxy.delete({ where: { id } }); }
  public inspectProxy() { return undefined; }
  public async createChat(i: CreateChatInput) {
    const value = await this.db.chat.upsert({ where: { telegramAccountId_telegramId: { telegramAccountId: i.telegramAccountId, telegramId: BigInt(i.telegramId) } }, create: { telegramAccountId: i.telegramAccountId, telegramId: BigInt(i.telegramId), type: i.type, ...(i.title === undefined ? {} : { title: i.title }), ...(i.username === undefined ? {} : { username: i.username }), ...(i.avatarUrl === undefined ? {} : { avatarUrl: i.avatarUrl }), ...(i.lastMessageAt === undefined ? {} : { lastMessageAt: i.lastMessageAt }), ...(i.unreadCount === undefined ? {} : { unreadCount: i.unreadCount }), ...(i.muted === undefined ? {} : { muted: i.muted }), ...(i.pinned === undefined ? {} : { pinned: i.pinned }) }, update: { type: i.type, ...(i.title === undefined ? {} : { title: i.title }), ...(i.username === undefined ? {} : { username: i.username }), ...(i.avatarUrl === undefined ? {} : { avatarUrl: i.avatarUrl }), ...(i.lastMessageAt === undefined ? {} : { lastMessageAt: i.lastMessageAt }), ...(i.unreadCount === undefined ? {} : { unreadCount: i.unreadCount }), ...(i.muted === undefined ? {} : { muted: i.muted }), ...(i.pinned === undefined ? {} : { pinned: i.pinned }) } });
    return value as StoredChat;
  }
  public async listChats(ownerId: string, options: { readonly accountId?: string; readonly type?: ChatType; readonly search?: string } = {}) {
    const accountWhere = { ownerId, ...(options.accountId === undefined ? {} : { id: options.accountId }) };
    const values = await this.db.chat.findMany({ where: { telegramAccount: accountWhere, ...(options.type === undefined ? {} : { type: options.type }), ...(options.search === undefined ? {} : { OR: [{ title: { contains: options.search, mode: "insensitive" } }, { username: { contains: options.search, mode: "insensitive" } }] }) }, orderBy: [{ pinned: "desc" }, { lastMessageAt: "desc" }] });
    return values as readonly StoredChat[];
  }
  public async findChat(id: string) { const value = await this.db.chat.findUnique({ where: { id } }); return value as StoredChat | undefined; }
  public async listMessages(chatId: string, options: { readonly limit?: number; readonly before?: bigint } = {}) { const values = await this.db.messageCache.findMany({ where: { chatId, ...(options.before === undefined ? {} : { telegramId: { lt: options.before } }) }, orderBy: { sentAt: "desc" }, take: Math.min(options.limit ?? 50, 100) }); return values as readonly StoredMessage[]; }
  public async createMessage(i: CreateMessageInput) { const value = await this.db.messageCache.upsert({ where: { chatId_telegramId: { chatId: i.chatId, telegramId: BigInt(i.telegramId) } }, create: { chatId: i.chatId, telegramId: BigInt(i.telegramId), ...(i.senderId === undefined ? {} : { senderId: BigInt(i.senderId) }), ...(i.body === undefined ? {} : { body: i.body }), ...(i.mediaType === undefined ? {} : { mediaType: i.mediaType }), sentAt: i.sentAt, ...(i.editedAt === undefined ? {} : { editedAt: i.editedAt }), ...(i.replyToId === undefined ? {} : { replyToId: BigInt(i.replyToId) }), ...(i.metadata === undefined ? {} : { metadata: i.metadata }) }, update: { ...(i.senderId === undefined ? {} : { senderId: BigInt(i.senderId) }), ...(i.body === undefined ? {} : { body: i.body }), ...(i.mediaType === undefined ? {} : { mediaType: i.mediaType }), sentAt: i.sentAt, ...(i.editedAt === undefined ? {} : { editedAt: i.editedAt }), ...(i.replyToId === undefined ? {} : { replyToId: BigInt(i.replyToId) }), ...(i.metadata === undefined ? {} : { metadata: i.metadata }) } }); return value as StoredMessage; }
  public async createContact(i: CreateContactInput) { const value = await this.db.contact.upsert({ where: { telegramAccountId_telegramId: { telegramAccountId: i.telegramAccountId, telegramId: BigInt(i.telegramId) } }, create: { telegramAccountId: i.telegramAccountId, telegramId: BigInt(i.telegramId), ...(i.firstName === undefined ? {} : { firstName: i.firstName }), ...(i.lastName === undefined ? {} : { lastName: i.lastName }), ...(i.username === undefined ? {} : { username: i.username }), ...(i.phone === undefined ? {} : { phone: i.phone }), ...(i.source === undefined ? {} : { source: i.source }), ...(i.notes === undefined ? {} : { notes: i.notes }), tags: [...(i.tags ?? [])] }, update: { ...(i.firstName === undefined ? {} : { firstName: i.firstName }), ...(i.lastName === undefined ? {} : { lastName: i.lastName }), ...(i.username === undefined ? {} : { username: i.username }), ...(i.phone === undefined ? {} : { phone: i.phone }), ...(i.source === undefined ? {} : { source: i.source }), ...(i.notes === undefined ? {} : { notes: i.notes }), ...(i.tags === undefined ? {} : { tags: [...i.tags] }) } }); return value as StoredContact; }
  public async listContacts(ownerId: string, options: { readonly accountId?: string; readonly search?: string; readonly limit?: number; readonly before?: bigint } = {}) { const values = await this.db.contact.findMany({ where: { telegramAccount: { ownerId, ...(options.accountId === undefined ? {} : { id: options.accountId }) }, ...(options.before === undefined ? {} : { telegramId: { lt: options.before } }), ...(options.search === undefined ? {} : { OR: [{ firstName: { contains: options.search, mode: "insensitive" } }, { lastName: { contains: options.search, mode: "insensitive" } }, { username: { contains: options.search, mode: "insensitive" } }, { phone: { contains: options.search } }] }) }, orderBy: { telegramId: "desc" }, take: Math.min(options.limit ?? 50, 100) }); return values as readonly StoredContact[]; }
  public async createTask(i: CreateTaskInput) { const value = await this.db.task.create({ data: { createdById: i.createdById, name: i.name, type: i.type, ...(i.target === undefined ? {} : { target: i.target }), ...(i.source === undefined ? {} : { source: i.source }), ...(i.accountIds && i.accountIds.length > 0 ? { accounts: { createMany: { data: i.accountIds.map((telegramAccountId) => ({ telegramAccountId })) } } } : {}) }, include: { accounts: true } }); return { ...value, accountIds: value.accounts.map((account) => account.telegramAccountId) } as StoredTask; }
  public async findTask(id: string) { const value = await this.db.task.findUnique({ where: { id }, include: { accounts: true } }); return value ? ({ ...value, accountIds: value.accounts.map((account) => account.telegramAccountId) } as StoredTask) : undefined; }
  public async listTasks(ownerId: string, options: { readonly status?: TaskStatus } = {}) { const values = await this.db.task.findMany({ where: { createdById: ownerId, ...(options.status === undefined ? {} : { status: options.status }) }, include: { accounts: true }, orderBy: { createdAt: "desc" } }); return values.map((value) => ({ ...value, accountIds: value.accounts.map((account) => account.telegramAccountId) })) as readonly StoredTask[]; }
  public async updateTask(id: string, input: UpdateTaskInput) { const value = await this.db.task.update({ where: { id }, data: input }); return this.findTask(value.id) as Promise<StoredTask>; }
  public async createInvitationTask(i: CreateInvitationTaskInput) { const value = await this.db.invitationTask.create({ data: { createdById: i.createdById, name: i.name, target: i.target, ...(i.scheduleAt === undefined ? {} : { scheduleAt: i.scheduleAt }), ...(i.notes === undefined ? {} : { notes: i.notes }), ...(i.accountIds.length === 0 ? {} : { accounts: { createMany: { data: i.accountIds.map((telegramAccountId) => ({ telegramAccountId })) } } }) }, include: { accounts: true, users: true } }); return { ...value, accountIds: value.accounts.map((account) => account.telegramAccountId), userCount: value.users.length } as StoredInvitationTask; }
  public async findInvitationTask(id: string) { const value = await this.db.invitationTask.findUnique({ where: { id }, include: { accounts: true, users: true } }); return value ? ({ ...value, accountIds: value.accounts.map((account) => account.telegramAccountId), userCount: value.users.length } as StoredInvitationTask) : undefined; }
  public async listInvitationTasks(ownerId: string) { const values = await this.db.invitationTask.findMany({ where: { createdById: ownerId }, include: { accounts: true, users: true }, orderBy: { createdAt: "desc" } }); return values.map((value) => ({ ...value, accountIds: value.accounts.map((account) => account.telegramAccountId), userCount: value.users.length })) as readonly StoredInvitationTask[]; }
  public async createInvitationImport(i: InvitationImportInput) { return this.db.$transaction(async (tx) => { const value = await tx.invitationImport.create({ data: { invitationTaskId: i.invitationTaskId, uploadedById: i.uploadedById, filename: i.filename, totalRows: i.totalRows, validRows: i.validRows, invalidRows: i.invalidRows, duplicateRows: i.duplicateRows } }); if (i.rows.length > 0) await tx.invitationUser.createMany({ data: i.rows.map((row) => ({ invitationTaskId: i.invitationTaskId, username: row.username, ...(row.telegramId === undefined ? {} : { telegramId: BigInt(row.telegramId) }), ...(row.accessHash === undefined ? {} : { accessHash: row.accessHash }), ...(row.firstName === undefined ? {} : { firstName: row.firstName }), ...(row.lastName === undefined ? {} : { lastName: row.lastName }), ...(row.note === undefined ? {} : { note: row.note }), ...(row.tag === undefined ? {} : { tag: row.tag }), ...(row.source === undefined ? {} : { source: row.source }) })) }); return value as StoredInvitationImport; }); }
  public async listInvitationImports(ownerId: string) { const values = await this.db.invitationImport.findMany({ where: { invitationTask: { createdById: ownerId } }, orderBy: { createdAt: "desc" } }); return values as readonly StoredInvitationImport[]; }
  public async createLog(i: CreateLogInput) { return this.db.log.create({ data: { type: i.type, level: i.level, ...(i.telegramAccountId ? { telegramAccountId: i.telegramAccountId } : {}), ...(i.proxyId ? { proxyId: i.proxyId } : {}), ...(i.workerId ? { workerId: i.workerId } : {}), ...(i.taskId ? { taskId: i.taskId } : {}), action: i.action, description: i.description, ...(i.errorCode ? { errorCode: i.errorCode } : {}), ...(i.metadata === undefined ? {} : { metadata: i.metadata }) } }) as Promise<StoredLog>; }
  public async listLogs(ownerId: string, o: { readonly type?: LogType; readonly level?: LogLevel; readonly accountId?: string; readonly taskId?: string; readonly search?: string; readonly limit?: number; readonly before?: Date } = {}) { const values = await this.db.log.findMany({ where: { ...(o.type ? { type: o.type } : {}), ...(o.level ? { level: o.level } : {}), ...(o.accountId ? { telegramAccountId: o.accountId } : {}), ...(o.taskId ? { taskId: o.taskId } : {}), ...(o.search ? { OR: [{ action: { contains: o.search, mode: "insensitive" } }, { description: { contains: o.search, mode: "insensitive" } }, { errorCode: { contains: o.search, mode: "insensitive" } }] } : {}), ...(o.before ? { createdAt: { lt: o.before } } : {}), OR: [{ telegramAccount: { ownerId } }, { telegramAccountId: null, task: { createdById: ownerId } }, { telegramAccountId: null, taskId: null }] }, orderBy: { createdAt: "desc" }, take: Math.min(o.limit ?? 50, 100) }); return values as readonly StoredLog[]; }
  public async createAuditLog(i: CreateAuditLogInput) { return this.db.auditLog.create({ data: { ...(i.actorId ? { actorId: i.actorId } : {}), ...(i.role ? { role: i.role } : {}), ...(i.ipAddress ? { ipAddress: i.ipAddress } : {}), action: i.action, entity: i.entity, ...(i.entityId ? { entityId: i.entityId } : {}), ...(i.before === undefined ? {} : { before: i.before }), ...(i.after === undefined ? {} : { after: i.after }), ...(i.metadata === undefined ? {} : { metadata: i.metadata }) } }) as Promise<StoredAuditLog>; }
  public async listAuditLogs(ownerId: string, o: { readonly search?: string; readonly entity?: string; readonly limit?: number; readonly before?: Date } = {}) { const values = await this.db.auditLog.findMany({ where: { ...(o.entity ? { entity: o.entity } : {}), ...(o.search ? { OR: [{ action: { contains: o.search, mode: "insensitive" } }, { entity: { contains: o.search, mode: "insensitive" } }, { entityId: { contains: o.search, mode: "insensitive" } }] } : {}), ...(o.before ? { createdAt: { lt: o.before } } : {}), OR: [{ actorId: ownerId }, { actorId: null }] }, orderBy: { createdAt: "desc" }, take: Math.min(o.limit ?? 50, 100) }); return values as readonly StoredAuditLog[]; }
}
