import type { WorkerHeartbeat, WorkerHeartbeatPort } from "@invait/contracts";
import { Redis as RedisClient } from "ioredis";
export interface RedisHeartbeatOptions { readonly redisUrl: string; readonly ttlSeconds?: number; readonly keyPrefix?: string; }
export class RedisWorkerHeartbeatPort implements WorkerHeartbeatPort {
  private readonly redis: RedisClient; private readonly ttlSeconds: number; private readonly keyPrefix: string;
  public constructor(options: RedisHeartbeatOptions) { this.redis = new RedisClient(options.redisUrl, { lazyConnect: true }); this.ttlSeconds = options.ttlSeconds ?? 45; this.keyPrefix = options.keyPrefix ?? "telegram_worker:"; }
  public async publish(heartbeat: WorkerHeartbeat): Promise<void> { if (this.redis.status === "wait") await this.redis.connect(); await this.redis.set(`${this.keyPrefix}${heartbeat.workerId}`, JSON.stringify(heartbeat), "EX", this.ttlSeconds); }
  public async close(): Promise<void> { await this.redis.quit(); }
}
