import { createServer, type Server } from "node:http";
import { pathToFileURL } from "node:url";

import { HealthController } from "./controllers/health.controller.js";
import { loadBackendConfig, type BackendConfig } from "./config/env.js";
import { HealthService } from "./services/health.service.js";
import type { ReadinessCheck } from "./types/health.js";
import { ApiController } from "./api/controller.js";
import { ApiSecurity, decodeEncryptionKey, type ApiSecurityConfig, type PasswordResetNotifier } from "./api/security.js";
import type { ProxyChecker } from "./api/proxy-manager.js";
import { PrismaApiStore, type ApiStore } from "./api/store.js";
import { BullMqCommandQueue, InMemoryCommandQueue, type CommandQueuePort } from "./queues/index.js";
import { prisma } from "./database/prisma-client.js";
import { EventHub } from "./realtime/event-hub.js";
import { Redis } from "ioredis";

export { HealthController } from "./controllers/health.controller.js";
export { backendDefaults, loadBackendConfig } from "./config/index.js";
export type { BackendConfig } from "./config/index.js";
export { HealthService } from "./services/index.js";
export type {
  HealthServerResponse,
  HealthServiceOptions,
  ReadinessCheck
} from "./types/index.js";
export * from "./workers/index.js";
export * from "./database/index.js";
export * from "./api/index.js";
export * from "./queues/index.js";
export * from "./realtime/event-hub.js";

export interface HealthServerOptions extends Partial<BackendConfig> {
  readonly readinessChecks?: readonly ReadinessCheck[];
  readonly apiStore?: ApiStore;
  readonly security?: ApiSecurityConfig;
  readonly passwordResetNotifier?: PasswordResetNotifier;
  readonly proxyChecker?: ProxyChecker;
  readonly commandQueue?: CommandQueuePort;
  readonly eventHub?: EventHub;
}

/** Build the HTTP server without opening a listening socket. */
export function createApp(options: HealthServerOptions = {}): Server {
  const defaults = loadBackendConfig();
  const service = new HealthService({
    ...(options.readinessChecks === undefined ? {} : { checks: options.readinessChecks }),
    checkTimeoutMs: options.healthCheckTimeoutMs ?? defaults.healthCheckTimeoutMs,
    version: options.version ?? defaults.version
  });
  const controller = new HealthController(service);
  const apiStore = options.apiStore ?? new PrismaApiStore(prisma);
  const commandQueue = options.commandQueue ?? new InMemoryCommandQueue();
  const security = new ApiSecurity(options.apiStore ?? apiStore, options.security ?? {
    accessTokenSecret: process.env.JWT_SECRET ?? "development-access-secret-change-me-32chars",
    refreshTokenSecret: process.env.JWT_REFRESH_SECRET ?? "development-refresh-secret-change-me-32chars",
    encryptionKey: decodeEncryptionKey(process.env.TELEGRAM_SESSION_ENCRYPTION_KEY ?? "development-encryption-key-32byt"),
    accessTokenTtlSeconds: 900,
    refreshTokenTtlSeconds: 86_400,
    passwordResetTtlSeconds: 900
  });
  const apiController = new ApiController({
    store: apiStore,
    security,
    passwordResetNotifier: options.passwordResetNotifier ?? { send: () => undefined },
    ...(options.proxyChecker === undefined ? {} : { proxyChecker: options.proxyChecker })
    , commandQueue, eventHub: options.eventHub ?? new EventHub()
  });

  const requestBuckets = new Map<string, { count: number; startedAt: number }>();
  return createServer((request, response) => {
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("X-Frame-Options", "DENY");
    response.setHeader("Referrer-Policy", "no-referrer");
    response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    if (process.env.NODE_ENV === "production") response.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    const url = request.url ?? "/";
    if (url.startsWith("/api/")) {
      const address = request.socket.remoteAddress ?? "unknown"; const now = Date.now(); const bucket = requestBuckets.get(address);
      const current = bucket && now - bucket.startedAt < 60_000 ? bucket : { count: 0, startedAt: now };
      current.count += 1; requestBuckets.set(address, current);
      if (current.count > 300) { response.writeHead(429, { "Content-Type": "application/json; charset=utf-8", "Retry-After": "60" }); response.end(JSON.stringify({ error: "rate_limit_exceeded" })); return; }
      void apiController.handle(request, response);
    }
    else void controller.handle(request, response);
  });
}

/** Alias that makes the Stage 1 public purpose explicit. */
export const createHealthServer = createApp;

function listen(server: Server, host: string, port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const onError = (error: Error): void => {
      server.off("listening", onListening);
      reject(error);
    };
    const onListening = (): void => {
      server.off("error", onError);
      resolve();
    };

    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port, host);
  });
}

export async function startServer(options: HealthServerOptions = {}): Promise<Server> {
  const defaults = loadBackendConfig();
  const host = options.host ?? defaults.host;
  const port = options.port ?? defaults.port;
  const server = createApp(options);
  await listen(server, host, port);
  return server;
}

export async function main(): Promise<void> {
  loadDotEnv();
  const config = loadBackendConfig();
  const redisUrl = process.env.REDIS_URL?.trim();
  if (config.nodeEnv === "production" && !redisUrl) throw new Error("REDIS_URL is required in production");
  const commandQueue = redisUrl ? new BullMqCommandQueue({ redisUrl }) : undefined;
  const readinessChecks: ReadinessCheck[] = [
    { name: "database", check: async () => { await prisma.$queryRaw`SELECT 1`; return true; } }
  ];
  if (redisUrl) {
    const probeRedis = new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1 });
    readinessChecks.push({ name: "redis", check: async () => { if (probeRedis.status === "wait") await probeRedis.connect(); return (await probeRedis.ping()) === "PONG"; } });
  }
  const server = await startServer({ ...config, readinessChecks, ...(commandQueue === undefined ? {} : { commandQueue }) });
  const address = server.address();
  const boundPort = typeof address === "object" && address !== null ? address.port : config.port;

  // Keep startup output intentionally free of environment values and secrets.
  console.info(`Backend listening on http://${config.host}:${boundPort}`);

  let shuttingDown = false;
  const shutdown = (signal: string): void => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    console.info(`Received ${signal}; shutting down`);
    server.close((error) => {
      if (error) {
        console.error("Backend shutdown failed");
        process.exitCode = 1;
      }
      if (commandQueue) void commandQueue.close();
    });
  };

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}

function loadDotEnv(): void {
  try {
    process.loadEnvFile(".env");
  } catch (error) {
    if (error instanceof Error && "code" in error && (error as NodeJS.ErrnoException).code === "ENOENT") return;
    throw error;
  }
}

function isMainModule(): boolean {
  const entrypoint = process.argv[1];
  return entrypoint !== undefined && pathToFileURL(entrypoint).href === import.meta.url;
}

if (isMainModule()) {
  void main().catch((error: unknown) => {
    console.error("Backend failed to start");
    process.exitCode = 1;
    if (loadBackendConfig().nodeEnv !== "production") {
      console.error(error instanceof Error ? error.message : "unknown startup error");
    }
  });
}
