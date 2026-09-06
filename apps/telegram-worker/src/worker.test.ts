import { describe, expect, it } from "vitest";
import type { WorkerCommandEnvelope, WorkerHeartbeat } from "@invait/contracts";
import {
  CommandRouter,
  TelegramWorker,
  createCommandRouter
} from "./index.js";

function command<TPayload>(
  type: WorkerCommandEnvelope["type"],
  payload: TPayload = {} as TPayload
): WorkerCommandEnvelope<TPayload> {
  return {
    id: "command-1",
    type,
    payload,
    createdAt: "2026-01-01T00:00:00.000Z",
    attempt: 1
  };
}

describe("telegram worker public composition", () => {
  it("routes a command through a registered handler", async () => {
    const seen: string[] = [];
    const router = createCommandRouter({
      HEALTH_CHECK: (received) => {
        seen.push(received.id);
        return { healthy: true };
      }
    });

    const result = await router.dispatch(command("HEALTH_CHECK"));

    expect(seen).toEqual(["command-1"]);
    expect(result.status).toBe("completed");
    expect(result.result).toEqual({ healthy: true });
  });

  it("defers Telegram work when no adapter is configured", async () => {
    const router = new CommandRouter();
    const result = await router.dispatch(command("SEND_MESSAGE"));

    expect(result.status).toBe("deferred");
    expect(result.reason).toBe("handler_not_configured");
  });

  it("publishes lifecycle heartbeats through the public port", async () => {
    const heartbeats: WorkerHeartbeat[] = [];
    const worker = new TelegramWorker({
      workerId: "worker-test",
      heartbeatPort: {
        publish: async (heartbeat) => {
          heartbeats.push(heartbeat);
        }
      },
      heartbeatIntervalMs: 60_000
    });

    await worker.start();
    expect(heartbeats.map((heartbeat) => heartbeat.lifecycle)).toEqual([
      "starting",
      "ready"
    ]);

    await worker.stop();
    expect(heartbeats.map((heartbeat) => heartbeat.lifecycle)).toEqual([
      "starting",
      "ready",
      "draining",
      "offline"
    ]);
    expect((await worker.health()).state).toBe("down");
  });
});
