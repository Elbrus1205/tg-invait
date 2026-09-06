import { afterEach, describe, expect, it } from "vitest";

import {
  InMemoryApiStore,
  createApp,
  type ApiSecurityConfig,
  type PasswordResetMessage
} from "../src/index.js";
import { InMemoryCommandQueue } from "../src/index.js";

const servers: ReturnType<typeof createApp>[] = [];

const security: ApiSecurityConfig = {
  accessTokenSecret: "test-access-secret-with-at-least-32-characters",
  refreshTokenSecret: "test-refresh-secret-with-at-least-32-characters",
  encryptionKey: Buffer.alloc(32, 7),
  accessTokenTtlSeconds: 300,
  refreshTokenTtlSeconds: 86_400,
  passwordResetTtlSeconds: 900
};

async function runningApi(options: {
  readonly store?: InMemoryApiStore;
  readonly onPasswordReset?: (message: PasswordResetMessage) => void | Promise<void>;
  readonly proxyChecker?: (proxy: { readonly id: string }) => Promise<{ readonly status: string; readonly pingMs?: number; readonly errorCode?: string }>;
  readonly commandQueue?: InMemoryCommandQueue;
} = {}) {
  const store = options.store ?? new InMemoryApiStore();
  const server = createApp({
    apiStore: store,
    security,
    ...(options.onPasswordReset === undefined
      ? {}
      : { passwordResetNotifier: { send: options.onPasswordReset } }),
    ...(options.proxyChecker === undefined ? {} : { proxyChecker: { check: options.proxyChecker } })
    , ...(options.commandQueue === undefined ? {} : { commandQueue: options.commandQueue })
  });

  await new Promise<void>((resolve, reject) => {
    const onError = (error: Error): void => reject(error);
    server.once("error", onError);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", onError);
      resolve();
    });
  });
  servers.push(server);

  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("Test server did not expose a TCP address");
  }

  return { baseUrl: `http://127.0.0.1:${address.port}`, store };
}

async function jsonRequest(
  baseUrl: string,
  path: string,
  options: {
    readonly method?: string;
    readonly token?: string;
    readonly body?: unknown;
  } = {}
) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? "GET",
    headers: {
      ...(options.token === undefined ? {} : { Authorization: `Bearer ${options.token}` }),
      ...(options.body === undefined ? {} : { "Content-Type": "application/json" })
    },
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) })
  });
  const raw = await response.text();
  const body = (raw ? JSON.parse(raw) : {}) as Record<string, unknown>;
  return { response, body };
}

async function registerOwner(baseUrl: string) {
  const result = await jsonRequest(baseUrl, "/api/auth/register", {
    method: "POST",
    body: {
      email: "owner@example.com",
      name: "Owner",
      password: "Correct-Horse-Battery-Staple-1"
    }
  });
  expect(result.response.status).toBe(201);
  return result.body as {
    readonly user: { readonly id: string; readonly email: string; readonly roles: string[] };
    readonly accessToken: string;
    readonly refreshToken: string;
  };
}

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) => new Promise<void>((resolve) => {
        if (!server.listening) {
          resolve();
          return;
        }
        server.close(() => resolve());
      })
    )
  );
});

describe("backend Prisma API boundary", () => {
  it("bootstraps the first registration as Owner and never exposes password hashes", async () => {
    const { baseUrl } = await runningApi();
    const auth = await registerOwner(baseUrl);

    expect(auth.user).toMatchObject({
      email: "owner@example.com",
      roles: ["OWNER"]
    });
    expect(auth).not.toHaveProperty("passwordHash");

    const me = await jsonRequest(baseUrl, "/api/auth/me", { token: auth.accessToken });
    expect(me.response.status).toBe(200);
    expect(me.body).toMatchObject({ user: { id: auth.user.id, roles: ["OWNER"] } });
  });

  it("rotates refresh tokens and revokes the session on logout", async () => {
    const { baseUrl } = await runningApi();
    const auth = await registerOwner(baseUrl);

    const refreshed = await jsonRequest(baseUrl, "/api/auth/refresh", {
      method: "POST",
      body: { refreshToken: auth.refreshToken }
    });
    expect(refreshed.response.status).toBe(200);
    expect(refreshed.body.refreshToken).not.toBe(auth.refreshToken);

    const replay = await jsonRequest(baseUrl, "/api/auth/refresh", {
      method: "POST",
      body: { refreshToken: auth.refreshToken }
    });
    expect(replay.response.status).toBe(401);

    const logout = await jsonRequest(baseUrl, "/api/auth/logout", {
      method: "POST",
      token: refreshed.body.accessToken as string
    });
    expect(logout.response.status).toBe(204);

    const me = await jsonRequest(baseUrl, "/api/auth/me", {
      token: refreshed.body.accessToken as string
    });
    expect(me.response.status).toBe(401);
  });

  it("enforces role permissions on user administration", async () => {
    const { baseUrl } = await runningApi();
    const owner = await registerOwner(baseUrl);

    const created = await jsonRequest(baseUrl, "/api/users", {
      method: "POST",
      token: owner.accessToken,
      body: {
        email: "viewer@example.com",
        name: "Viewer",
        password: "Another-Secure-Password-2",
        role: "VIEWER"
      }
    });
    expect(created.response.status).toBe(201);

    const viewerLogin = await jsonRequest(baseUrl, "/api/auth/login", {
      method: "POST",
      body: { email: "viewer@example.com", password: "Another-Secure-Password-2" }
    });
    expect(viewerLogin.response.status).toBe(200);

    const forbidden = await jsonRequest(baseUrl, "/api/users", {
      token: viewerLogin.body.accessToken as string
    });
    expect(forbidden.response.status).toBe(403);
    expect(forbidden.body).toEqual({ error: "permission_denied" });

    const users = await jsonRequest(baseUrl, "/api/users", { token: owner.accessToken });
    expect(users.response.status).toBe(200);
    expect(users.body).toMatchObject({ items: expect.arrayContaining([expect.objectContaining({ email: "owner@example.com" })]) });
    expect(JSON.stringify(users.body)).not.toContain("passwordHash");
  });

  it("provides account CRUD with ownership filtering and masked phones", async () => {
    const { baseUrl } = await runningApi();
    const owner = await registerOwner(baseUrl);

    const created = await jsonRequest(baseUrl, "/api/accounts", {
      method: "POST",
      token: owner.accessToken,
      body: {
        telegramId: "123456789012345678",
        username: "authorised_account",
        phone: "+79991234567",
        firstName: "Authorised"
      }
    });
    expect(created.response.status).toBe(201);
    expect(created.body).toMatchObject({
      account: {
        telegramId: "123456789012345678",
        phone: "+7*******67",
        status: "OFFLINE"
      }
    });

    const accountId = (created.body.account as { id: string }).id;
    const updated = await jsonRequest(baseUrl, `/api/accounts/${accountId}`, {
      method: "PATCH",
      token: owner.accessToken,
      body: { status: "DISABLED", lastName: "Account" }
    });
    expect(updated.response.status).toBe(200);
    expect(updated.body).toMatchObject({ account: { status: "DISABLED", lastName: "Account" } });

    const list = await jsonRequest(baseUrl, "/api/accounts?status=DISABLED&search=authorised", {
      token: owner.accessToken
    });
    expect(list.response.status).toBe(200);
    expect(list.body).toMatchObject({ items: [{ id: accountId }] });
    expect(JSON.stringify(list.body)).not.toContain("+79991234567");
  });

  it("encrypts proxy credentials at the repository seam and redacts every API response", async () => {
    const { baseUrl, store } = await runningApi();
    const owner = await registerOwner(baseUrl);

    const created = await jsonRequest(baseUrl, "/api/proxies", {
      method: "POST",
      token: owner.accessToken,
      body: {
        name: "Germany #1",
        host: "127.0.0.1",
        port: 1080,
        protocol: "SOCKS5",
        username: "proxy-user",
        password: "proxy-password",
        country: "DE"
      }
    });
    expect(created.response.status).toBe(201);
    expect(created.body).toMatchObject({
      proxy: { name: "Germany #1", hasUsername: true, hasPassword: true, status: "UNKNOWN" }
    });
    expect(JSON.stringify(created.body)).not.toContain("proxy-user");
    expect(JSON.stringify(created.body)).not.toContain("proxy-password");

    const proxyId = (created.body.proxy as { id: string }).id;
    const persisted = store.inspectProxy(proxyId);
    expect(persisted?.encryptedUsername).not.toContain("proxy-user");
    expect(persisted?.encryptedPassword).not.toContain("proxy-password");

    const list = await jsonRequest(baseUrl, "/api/proxies", { token: owner.accessToken });
    expect(list.response.status).toBe(200);
    expect(JSON.stringify(list.body)).not.toContain("encryptedUsername");
    expect(JSON.stringify(list.body)).not.toContain("encryptedPassword");
  });

  it("assigns a concrete proxy to an account without contacting Telegram inline", async () => {
    const { baseUrl } = await runningApi();
    const owner = await registerOwner(baseUrl);
    const proxy = await jsonRequest(baseUrl, "/api/proxies", {
      method: "POST",
      token: owner.accessToken,
      body: {
        name: "Local",
        host: "127.0.0.2",
        port: 8080,
        protocol: "HTTP"
      }
    });
    const proxyId = (proxy.body.proxy as { id: string }).id;

    const account = await jsonRequest(baseUrl, "/api/accounts", {
      method: "POST",
      token: owner.accessToken,
      body: { username: "with_proxy", proxyId }
    });
    expect(account.response.status).toBe(201);
    expect(account.body).toMatchObject({ account: { proxy: { id: proxyId, name: "Local" } } });
  });

  it("uses a notifier seam for password reset without disclosing account existence", async () => {
    const messages: PasswordResetMessage[] = [];
    const { baseUrl } = await runningApi({ onPasswordReset: (message) => messages.push(message) });
    await registerOwner(baseUrl);

    const known = await jsonRequest(baseUrl, "/api/auth/forgot-password", {
      method: "POST",
      body: { email: "owner@example.com" }
    });
    const unknown = await jsonRequest(baseUrl, "/api/auth/forgot-password", {
      method: "POST",
      body: { email: "missing@example.com" }
    });
    expect(known.response.status).toBe(202);
    expect(unknown.response.status).toBe(202);
    expect(known.body).toEqual(unknown.body);
    expect(messages).toHaveLength(1);

    const reset = await jsonRequest(baseUrl, "/api/auth/reset-password", {
      method: "POST",
      body: {
        token: messages[0]?.token,
        password: "Replaced-Secure-Password-3"
      }
    });
    expect(reset.response.status).toBe(204);

    const oldLogin = await jsonRequest(baseUrl, "/api/auth/login", {
      method: "POST",
      body: { email: "owner@example.com", password: "Correct-Horse-Battery-Staple-1" }
    });
    const newLogin = await jsonRequest(baseUrl, "/api/auth/login", {
      method: "POST",
      body: { email: "owner@example.com", password: "Replaced-Secure-Password-3" }
    });
    expect(oldLogin.response.status).toBe(401);
    expect(newLogin.response.status).toBe(200);
  });

  it("publishes a redacted OpenAPI document", async () => {
    const { baseUrl } = await runningApi();
    const response = await fetch(`${baseUrl}/api/openapi.json`);
    expect(response.status).toBe(200);
    const document = await response.text();
    expect(document).toContain("/api/auth/login");
    expect(document).toContain("/api/accounts");
    expect(document).toContain("/api/proxies");
    expect(document).not.toContain("encryptedPassword");
  });

  it("supports proxy import, edit, disable, test and delete with admin-only mutations", async () => {
    const checks = new Map<string, { readonly status: string; readonly pingMs?: number; readonly errorCode?: string }>();
    const { baseUrl } = await runningApi({
      proxyChecker: async (proxy) => checks.get(proxy.id) ?? { status: "TIMEOUT", errorCode: "timeout" }
    });
    const owner = await registerOwner(baseUrl);

    const imported = await jsonRequest(baseUrl, "/api/proxies/import", {
      method: "POST",
      token: owner.accessToken,
      body: {
        protocol: "SOCKS5",
        text: "127.0.0.1:1080\nuser:secret@127.0.0.2:1081\n127.0.0.3:1082:login:pass"
      }
    });
    expect(imported.response.status).toBe(201);
    expect(imported.body).toMatchObject({ created: 3, invalid: 0 });
    expect(JSON.stringify(imported.body)).not.toContain("secret");

    const list = await jsonRequest(baseUrl, "/api/proxies", { token: owner.accessToken });
    const first = (list.body.items as Array<{ id: string; host: string }>)[0];
    checks.set(first.id, { status: "ONLINE", pingMs: 48 });

    const tested = await jsonRequest(baseUrl, `/api/proxies/${first.id}/test`, {
      method: "POST",
      token: owner.accessToken
    });
    expect(tested.response.status).toBe(200);
    expect(tested.body).toMatchObject({ proxy: { status: "ONLINE", pingMs: 48 } });

    const edited = await jsonRequest(baseUrl, `/api/proxies/${first.id}`, {
      method: "PATCH",
      token: owner.accessToken,
      body: { name: "Edited", host: "127.0.0.10", port: 1090, username: "new-user", password: "new-password" }
    });
    expect(edited.response.status).toBe(200);
    expect(edited.body).toMatchObject({ proxy: { name: "Edited", host: "127.0.0.10", hasUsername: true } });
    expect(JSON.stringify(edited.body)).not.toContain("new-password");

    const disabled = await jsonRequest(baseUrl, `/api/proxies/${first.id}/disable`, {
      method: "POST",
      token: owner.accessToken
    });
    expect(disabled.response.status).toBe(200);
    expect(disabled.body).toMatchObject({ proxy: { status: "DISABLED" } });

    const createdViewer = await jsonRequest(baseUrl, "/api/users", {
      method: "POST",
      token: owner.accessToken,
      body: { email: "proxy-viewer@example.com", password: "Viewer-Secure-Password-2", role: "VIEWER" }
    });
    const viewer = await jsonRequest(baseUrl, "/api/auth/login", {
      method: "POST",
      body: { email: "proxy-viewer@example.com", password: "Viewer-Secure-Password-2" }
    });
    expect(createdViewer.response.status).toBe(201);
    const forbidden = await jsonRequest(baseUrl, `/api/proxies/${first.id}/disable`, {
      method: "POST",
      token: viewer.body.accessToken as string
    });
    expect(forbidden.response.status).toBe(403);

    const deleted = await jsonRequest(baseUrl, `/api/proxies/${first.id}`, {
      method: "DELETE",
      token: owner.accessToken
    });
    expect(deleted.response.status).toBe(204);
    const missing = await jsonRequest(baseUrl, `/api/proxies/${first.id}`, { token: owner.accessToken });
    expect(missing.response.status).toBe(404);
  });

  it("runs Test All and reports each proxy result without exposing credentials", async () => {
    const results = new Map<string, { readonly status: string; readonly pingMs?: number; readonly errorCode?: string }>();
    const { baseUrl } = await runningApi({ proxyChecker: async (proxy) => results.get(proxy.id) ?? { status: "AUTHENTICATION_ERROR", errorCode: "proxy_auth" } });
    const owner = await registerOwner(baseUrl);
    for (const [name, port] of [["One", 2001], ["Two", 2002]] as const) {
      await jsonRequest(baseUrl, "/api/proxies", { method: "POST", token: owner.accessToken, body: { name, host: "127.0.0.1", port, protocol: "HTTP", password: "hidden" } });
    }
    const tested = await jsonRequest(baseUrl, "/api/proxies/test-all", { method: "POST", token: owner.accessToken });
    expect(tested.response.status).toBe(200);
    expect(tested.body).toMatchObject({ results: [{ status: "AUTHENTICATION_ERROR" }, { status: "AUTHENTICATION_ERROR" }] });
    expect(JSON.stringify(tested.body)).not.toContain("hidden");
  });

  it("queues account connection and verification work instead of calling Telegram inline", async () => {
    const commandQueue = new InMemoryCommandQueue();
    const { baseUrl } = await runningApi({ commandQueue });
    const owner = await registerOwner(baseUrl);
    const requested = await jsonRequest(baseUrl, "/api/accounts/connect/request", {
      method: "POST",
      token: owner.accessToken,
      body: { phone: "+79991234567" }
    });
    expect(requested.response.status).toBe(202);
    expect(requested.body).toMatchObject({ account: { status: "CONNECTING", phone: "+7*******67" } });
    const accountId = (requested.body.account as { id: string }).id;
    const command = commandQueue.dequeue();
    expect(command).toMatchObject({ type: "CONNECT_ACCOUNT", accountId, requestedBy: owner.user.id, payload: { phone: "+79991234567", phase: "request_code" } });

    const verified = await jsonRequest(baseUrl, `/api/accounts/${accountId}/connect/verify`, {
      method: "POST",
      token: owner.accessToken,
      body: { code: "12345", twoFactorPassword: "not-logged" }
    });
    expect(verified.response.status).toBe(202);
    const verificationCommand = commandQueue.dequeue();
    expect(verificationCommand).toMatchObject({ type: "CONNECT_ACCOUNT", accountId, payload: { code: "12345", phase: "verify_code" } });
    expect(JSON.stringify(verificationCommand)).not.toContain("not-logged");
  });

  it("queues disconnect and proxy changes with ownership and role checks", async () => {
    const commandQueue = new InMemoryCommandQueue();
    const { baseUrl } = await runningApi({ commandQueue });
    const owner = await registerOwner(baseUrl);
    const account = await jsonRequest(baseUrl, "/api/accounts", { method: "POST", token: owner.accessToken, body: { username: "managed" } });
    const accountId = (account.body.account as { id: string }).id;
    const disconnected = await jsonRequest(baseUrl, `/api/accounts/${accountId}/disconnect`, { method: "POST", token: owner.accessToken });
    expect(disconnected.response.status).toBe(202);
    expect(commandQueue.dequeue()).toMatchObject({ type: "DISCONNECT_ACCOUNT", accountId, requestedBy: owner.user.id });
  });

  it("queues encrypted TData without exposing archive bytes", async () => {
    const commandQueue = new InMemoryCommandQueue();
    const { baseUrl } = await runningApi({ commandQueue });
    const owner = await registerOwner(baseUrl);
    const response = await jsonRequest(baseUrl, "/api/accounts/import-tdata", {
      method: "POST",
      token: owner.accessToken,
      body: { filename: "owned.zip", archiveBase64: Buffer.from("private-tdata").toString("base64") }
    });
    expect(response.response.status).toBe(202);
    expect(response.body).toMatchObject({ status: "QUEUED" });
    const command = commandQueue.dequeue();
    expect(command).toMatchObject({ type: "IMPORT_TDATA", requestedBy: owner.user.id, payload: { filename: "owned.zip" } });
    expect(JSON.stringify(command)).not.toContain("private-tdata");
  });

  it("lists only owned chats and queues a dialog sync", async () => {
    const commandQueue = new InMemoryCommandQueue();
    const store = new InMemoryApiStore();
    const { baseUrl } = await runningApi({ store, commandQueue });
    const owner = await registerOwner(baseUrl);
    const account = await jsonRequest(baseUrl, "/api/accounts", {
      method: "POST",
      token: owner.accessToken,
      body: { username: "chat-account" }
    });
    const accountId = (account.body.account as { id: string }).id;
    await store.createChat({
      telegramAccountId: accountId,
      telegramId: 101n,
      type: "PRIVATE",
      title: "Alice",
      username: "alice",
      lastMessageAt: new Date("2026-01-01T00:00:00.000Z")
    });
    const list = await jsonRequest(baseUrl, `/api/chats?accountId=${accountId}&search=alice`, { token: owner.accessToken });
    expect(list.response.status).toBe(200);
    expect(list.body).toMatchObject({ items: [{ telegramId: "101", title: "Alice", type: "PRIVATE" }] });

    const sync = await jsonRequest(baseUrl, `/api/chats/sync?accountId=${accountId}`, {
      method: "POST",
      token: owner.accessToken
    });
    expect(sync.response.status).toBe(202);
    expect(commandQueue.dequeue()).toMatchObject({ type: "LOAD_DIALOGS", accountId, requestedBy: owner.user.id });
  });

  it("does not expose chats belonging to another account owner", async () => {
    const store = new InMemoryApiStore();
    const { baseUrl } = await runningApi({ store });
    const owner = await registerOwner(baseUrl);
    const other = await store.createUser({ email: "other@example.com", passwordHash: "hash", role: "OWNER" });
    const otherAccount = await store.createAccount({ ownerId: other.id, username: "other" });
    await store.createChat({ telegramAccountId: otherAccount.id, telegramId: 202n, type: "GROUP", title: "Private" });
    const response = await jsonRequest(baseUrl, `/api/chats?accountId=${otherAccount.id}`, { token: owner.accessToken });
    expect(response.response.status).toBe(404);
    expect(response.body).toEqual({ error: "not_found" });
  });

  it("paginates owned message cache and queues sends without executing Telegram inline", async () => {
    const commandQueue = new InMemoryCommandQueue();
    const store = new InMemoryApiStore();
    const { baseUrl } = await runningApi({ store, commandQueue });
    const owner = await registerOwner(baseUrl);
    const account = await jsonRequest(baseUrl, "/api/accounts", { method: "POST", token: owner.accessToken, body: { username: "message-account" } });
    const accountId = (account.body.account as { id: string }).id;
    const chat = await store.createChat({ telegramAccountId: accountId, telegramId: 303n, type: "PRIVATE", title: "Bob" });
    await store.createMessage({ chatId: chat.id, telegramId: 1n, senderId: 303n, body: "hello", sentAt: new Date("2026-01-01T00:00:00.000Z") });
    await store.createMessage({ chatId: chat.id, telegramId: 2n, senderId: 303n, body: "world", sentAt: new Date("2026-01-01T00:01:00.000Z") });

    const messages = await jsonRequest(baseUrl, `/api/messages?chatId=${chat.id}&limit=1`, { token: owner.accessToken });
    expect(messages.response.status).toBe(200);
    expect(messages.body).toMatchObject({ items: [{ telegramId: "2", body: "world" }], nextCursor: "2" });

    const sync = await jsonRequest(baseUrl, `/api/messages/sync?chatId=${chat.id}`, { method: "POST", token: owner.accessToken });
    expect(sync.response.status).toBe(202);
    expect(commandQueue.dequeue()).toMatchObject({ type: "LOAD_MESSAGES", accountId, payload: { chatId: chat.id } });

    const sent = await jsonRequest(baseUrl, "/api/messages", { method: "POST", token: owner.accessToken, body: { chatId: chat.id, text: "queued message" } });
    expect(sent.response.status).toBe(202);
    expect(commandQueue.dequeue()).toMatchObject({ type: "SEND_MESSAGE", requestedBy: owner.user.id, payload: { chatId: chat.id, text: "queued message" } });
  });

  it("lists owned contacts with search and queues contact sync", async () => {
    const commandQueue = new InMemoryCommandQueue();
    const store = new InMemoryApiStore();
    const { baseUrl } = await runningApi({ store, commandQueue });
    const owner = await registerOwner(baseUrl);
    const account = await jsonRequest(baseUrl, "/api/accounts", { method: "POST", token: owner.accessToken, body: { username: "contacts-account" } });
    const accountId = (account.body.account as { id: string }).id;
    await store.createContact({ telegramAccountId: accountId, telegramId: 404n, firstName: "Carol", username: "carol", phone: "+79990000000", tags: ["lead"] });
    const list = await jsonRequest(baseUrl, `/api/contacts?accountId=${accountId}&search=carol`, { token: owner.accessToken });
    expect(list.response.status).toBe(200);
    expect(list.body).toMatchObject({ items: [{ telegramId: "404", firstName: "Carol", username: "carol", phone: "+7*******00" }] });
    const sync = await jsonRequest(baseUrl, `/api/contacts/sync?accountId=${accountId}`, { method: "POST", token: owner.accessToken });
    expect(sync.response.status).toBe(202);
    expect(commandQueue.dequeue()).toMatchObject({ type: "LOAD_CONTACTS", accountId, requestedBy: owner.user.id });
  });

  it("persists tasks with owned accounts and queues them for BullMQ processing", async () => {
    const commandQueue = new InMemoryCommandQueue();
    const { baseUrl } = await runningApi({ commandQueue });
    const owner = await registerOwner(baseUrl);
    const account = await jsonRequest(baseUrl, "/api/accounts", { method: "POST", token: owner.accessToken, body: { username: "task-account" } });
    const accountId = (account.body.account as { id: string }).id;
    const created = await jsonRequest(baseUrl, "/api/tasks", { method: "POST", token: owner.accessToken, body: { name: "Authorised operation", type: "PROCESS_TASK", accountIds: [accountId], target: { kind: "owned-resource" } } });
    expect(created.response.status).toBe(201);
    expect(created.body).toMatchObject({ task: { name: "Authorised operation", status: "DRAFT", accountIds: [accountId] } });
    const taskId = (created.body.task as { id: string }).id;
    const queued = await jsonRequest(baseUrl, `/api/tasks/${taskId}/queue`, { method: "POST", token: owner.accessToken });
    expect(queued.response.status).toBe(202);
    expect(queued.body).toMatchObject({ task: { status: "QUEUED" } });
    expect(commandQueue.dequeue()).toMatchObject({ type: "PROCESS_TASK", requestedBy: owner.user.id, payload: { taskId } });
    const list = await jsonRequest(baseUrl, "/api/tasks?status=QUEUED", { token: owner.accessToken });
    expect(list.body).toMatchObject({ items: [{ id: taskId, status: "QUEUED" }] });
  });

  it("previews CSV invitation imports and queues an owned invitation task", async () => {
    const commandQueue = new InMemoryCommandQueue();
    const { baseUrl, store } = await runningApi({ commandQueue });
    const owner = await registerOwner(baseUrl);
    const account = await jsonRequest(baseUrl, "/api/accounts", { method: "POST", token: owner.accessToken, body: { username: "invite-account" } });
    const accountId = (account.body.account as { id: string }).id;
    const chat = await store.createChat({ telegramAccountId: accountId, telegramId: 505n, type: "SUPERGROUP", title: "Owned target" });
    const taskResponse = await jsonRequest(baseUrl, "/api/invitations/tasks", { method: "POST", token: owner.accessToken, body: { name: "Allowed invites", target: { chatId: chat.id }, accountIds: [accountId] } });
    expect(taskResponse.response.status).toBe(201);
    const taskId = (taskResponse.body.task as { id: string }).id;
    const imported = await jsonRequest(baseUrl, "/api/invitations/import", { method: "POST", token: owner.accessToken, body: { taskId, filename: "users.csv", fileBase64: Buffer.from("username\n@user_one\nuser_one\ninvalid!").toString("base64") } });
    expect(imported.response.status).toBe(201);
    expect(imported.body).toMatchObject({ preview: { totalRows: 3, valid: 1, invalid: 1, duplicates: 1 } });
    const queued = await jsonRequest(baseUrl, `/api/invitations/tasks/${taskId}/queue`, { method: "POST", token: owner.accessToken });
    expect(queued.response.status).toBe(202);
    expect(commandQueue.dequeue()).toMatchObject({ type: "PROCESS_INVITATION_ITEM", payload: { invitationTaskId: taskId } });
  });

  it("lists owned logs and append-only audit records with filters and redacted metadata", async () => {
    const store = new InMemoryApiStore();
    const { baseUrl } = await runningApi({ store });
    const owner = await registerOwner(baseUrl);
    const createdAccount = await jsonRequest(baseUrl, "/api/accounts", { method: "POST", token: owner.accessToken, body: { username: "audited-account" } });
    expect(createdAccount.response.status).toBe(201);
    await store.createLog({ type: "AUTHENTICATION", level: "INFO", action: "LOGIN", description: "Successful login", metadata: { token: "secret-token" } });
    await store.createAuditLog({ actorId: owner.user.id, role: "OWNER", action: "CREATE", entity: "User", entityId: owner.user.id, metadata: { passwordHash: "hash", session: "secret-session" } });
    const logs = await jsonRequest(baseUrl, "/api/logs?type=AUTHENTICATION&level=INFO&search=login", { token: owner.accessToken });
    expect(logs.response.status).toBe(200);
    expect(logs.body).toMatchObject({ items: [{ type: "AUTHENTICATION", action: "LOGIN" }] });
    expect(JSON.stringify(logs.body)).not.toContain("secret-token");
    const audit = await jsonRequest(baseUrl, "/api/audit?entity=User", { token: owner.accessToken });
    expect(audit.response.status).toBe(200);
    expect(audit.body).toMatchObject({ items: [{ action: "CREATE", entity: "User" }] });
    expect(JSON.stringify(audit.body)).not.toContain("secret-session");
    const accountAudit = await jsonRequest(baseUrl, "/api/audit?entity=TelegramAccount&search=CREATE", { token: owner.accessToken });
    expect(accountAudit.body).toMatchObject({ items: [{ action: "CREATE", entity: "TelegramAccount" }] });
  });

  it("denies logs and audit endpoints without read permission", async () => {
    const { baseUrl } = await runningApi();
    const owner = await registerOwner(baseUrl);
    const created = await jsonRequest(baseUrl, "/api/users", { method: "POST", token: owner.accessToken, body: { email: "viewer@example.com", password: "Correct-Horse-Battery-Staple-2", role: "VIEWER" } });
    const viewer = await jsonRequest(baseUrl, "/api/auth/login", { method: "POST", body: { email: "viewer@example.com", password: "Correct-Horse-Battery-Staple-2" } });
    expect(created.response.status).toBe(201);
    expect((await jsonRequest(baseUrl, "/api/logs", { token: viewer.body.accessToken as string })).response.status).toBe(200);
    expect((await jsonRequest(baseUrl, "/api/audit", { token: viewer.body.accessToken as string })).response.status).toBe(200);
  });

  it("supports owner user role updates and deletion without exposing credentials", async () => {
    const { baseUrl } = await runningApi();
    const owner = await registerOwner(baseUrl);
    const created = await jsonRequest(baseUrl, "/api/users", { method: "POST", token: owner.accessToken, body: { email: "operator@example.com", name: "Operator", password: "Correct-Horse-Battery-Staple-3", role: "VIEWER" } });
    const userId = (created.body.user as { id: string }).id;
    const updated = await jsonRequest(baseUrl, `/api/users/${userId}`, { method: "PATCH", token: owner.accessToken, body: { name: "Updated", role: "OPERATOR" } });
    expect(updated.response.status).toBe(200);
    expect(updated.body).toMatchObject({ user: { id: userId, name: "Updated", roles: ["OPERATOR"] } });
    expect(JSON.stringify(updated.body)).not.toContain("passwordHash");
    const removed = await jsonRequest(baseUrl, `/api/users/${userId}`, { method: "DELETE", token: owner.accessToken });
    expect(removed.response.status).toBe(204);
  });
});
