import { loadWorkerConfig } from "./config/index.js";
export { createTDataImporter, TDataImportError } from "./tdata-import.js";
export type { TDataConversionProfile, TDataConversionResult, TDataConverter, TDataConverterInput, TDataImportErrorCode, TDataImportOptions, TDataImportResult, TDataImporter, TDataInspection } from "./tdata-import.js";

export { TelegramWorker, createTelegramWorker } from "./workers/runtime.js";
export { CommandRouter, createCommandRouter, isWorkerCommandType } from "./workers/command-router.js";
export type { WorkerCommandHandlerMap } from "./workers/command-router.js";
export { HeartbeatLoop } from "./workers/heartbeat-loop.js";
export type { HeartbeatLoopOptions } from "./workers/heartbeat-loop.js";
export { InMemoryAccountLockRegistry } from "./workers/account-lock.js";
export type { AccountLockLease, AccountLockPort, LockClock } from "./workers/account-lock.js";
export { createAccountLifecycleHandlers } from "./workers/account-lifecycle.js";
export type { AccountLifecycleOptions, AccountLifecycleStatus, AccountStatePort } from "./workers/account-lifecycle.js";
export { RedisAccountLockRegistry } from "./workers/redis-account-lock.js";
export type { RedisAccountLockOptions } from "./workers/redis-account-lock.js";
export { PrismaAccountStatePort } from "./workers/prisma-account-state.js";
export { InMemoryCommandConsumer } from "./queues/command-consumer.js";
export { BullMqCommandConsumer, assertCommandHandled } from "./queues/bullmq-command-consumer.js";
export type { BullMqCommandConsumerOptions } from "./queues/bullmq-command-consumer.js";
export { RedisWorkerHeartbeatPort } from "./queues/redis-heartbeat.js";
export type { RedisHeartbeatOptions } from "./queues/redis-heartbeat.js";
export type {
  TelegramWorkerOptions,
  WorkerClock,
  WorkerCommandConsumer,
  WorkerCommandHandler,
  WorkerCommandRouteResult,
  WorkerCommandSubscription,
  WorkerHealthProbe,
  WorkerHealthReport,
  WorkerSnapshot
} from "./types/index.js";
export { loadWorkerConfig } from "./config/index.js";
export type { WorkerConfig } from "./config/index.js";
export { decodeEncryptionKey, redactSecret } from "./security/index.js";
export type { TelegramGateway } from "./telegram/index.js";
export { UnconfiguredTelegramGateway } from "./telegram/index.js";

/**
 * The executable entry point is deliberately inert until infrastructure
 * adapters are supplied by a later stage. Importing this module never starts
 * a timer or contacts Telegram.
 */
export function createWorkerComposition(): {
  readonly config: ReturnType<typeof loadWorkerConfig>;
} {
  return { config: loadWorkerConfig() };
}
