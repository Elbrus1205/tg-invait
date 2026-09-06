export interface WorkerConfig {
  readonly workerId: string;
  readonly heartbeatIntervalMs: number;
  readonly version: string;
  readonly redisUrl?: string;
  readonly accountLockTtlMs: number;
}

function positiveInteger(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function loadWorkerConfig(
  env: NodeJS.ProcessEnv = process.env,
  pid = process.pid
): WorkerConfig {
  return {
    workerId: env.TELEGRAM_WORKER_ID?.trim() || `telegram-worker-${pid}`,
    heartbeatIntervalMs: positiveInteger(env.TELEGRAM_WORKER_HEARTBEAT_MS, 15_000),
    version: env.APP_VERSION?.trim() || "0.1.0",
    ...(env.REDIS_URL?.trim() ? { redisUrl: env.REDIS_URL.trim() } : {}),
    accountLockTtlMs: positiveInteger(env.TELEGRAM_ACCOUNT_LOCK_TTL_MS, 60_000)
  };
}
