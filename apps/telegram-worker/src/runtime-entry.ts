import { pathToFileURL } from "node:url";
import { PrismaClient } from "@prisma/client";

import { loadWorkerConfig } from "./config/index.js";
import { BullMqCommandConsumer } from "./queues/bullmq-command-consumer.js";
import { RedisWorkerHeartbeatPort } from "./queues/redis-heartbeat.js";
import { decodeEncryptionKey } from "./security/index.js";
import { GramJsTelegramGateway } from "./telegram/gramjs-gateway.js";
import { PrismaAccountStatePort } from "./workers/prisma-account-state.js";
import { PrismaTaskExecutor, PrismaTaskStatePort } from "./workers/prisma-task-runtime.js";
import { RedisAccountLockRegistry } from "./workers/redis-account-lock.js";
import { createTelegramWorker } from "./workers/runtime.js";

export async function main(): Promise<void> {
  loadDotEnv();
  const config = loadWorkerConfig();
  if (!config.redisUrl) throw new Error("REDIS_URL is required for telegram-worker");
  const apiId = Number(process.env.TELEGRAM_API_ID);
  const apiHash = process.env.TELEGRAM_API_HASH?.trim();
  const encryptionKeyValue = process.env.TELEGRAM_SESSION_ENCRYPTION_KEY;
  if (!Number.isInteger(apiId) || apiId <= 0 || !apiHash || !encryptionKeyValue) throw new Error("Telegram credentials are required for telegram-worker");
  const encryptionKey = decodeEncryptionKey(encryptionKeyValue);
  const prisma = new PrismaClient();
  const heartbeatPort = new RedisWorkerHeartbeatPort({ redisUrl: config.redisUrl });
  const accountLock = new RedisAccountLockRegistry({ redisUrl: config.redisUrl, ttlMs: config.accountLockTtlMs });
  const gateway = new GramJsTelegramGateway({ prisma, redisUrl: config.redisUrl, apiId, apiHash, encryptionKey });
  const worker = createTelegramWorker({
    workerId: config.workerId,
    heartbeatIntervalMs: config.heartbeatIntervalMs,
    version: config.version,
    heartbeatPort,
    prisma,
    commandConsumer: new BullMqCommandConsumer({ redisUrl: config.redisUrl, workerName: config.workerId }),
    telegramGateway: gateway,
    accountLock,
    accountState: new PrismaAccountStatePort(prisma),
    taskState: new PrismaTaskStatePort(prisma),
    taskExecutor: new PrismaTaskExecutor(prisma),
    accountLockTtlMs: config.accountLockTtlMs
  });

  await worker.start();
  console.info(`Telegram worker ${config.workerId} is ready`);

  const shutdown = async (signal: string): Promise<void> => {
    console.info(`Received ${signal}; shutting down worker`);
    await worker.stop();
    await Promise.all([heartbeatPort.close(), accountLock.close(), gateway.close(), prisma.$disconnect()]);
  };

  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));
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
  void main().catch(() => {
    console.error("Telegram worker failed to start");
    process.exitCode = 1;
  });
}
