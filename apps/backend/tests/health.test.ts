import { afterEach, describe, expect, it } from "vitest";

import { createHealthServer, type HealthServerOptions } from "../src/index.js";

const servers: ReturnType<typeof createHealthServer>[] = [];

async function runningServer(options: HealthServerOptions = {}) {
  const server = createHealthServer(options);
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
  return `http://127.0.0.1:${address.port}`;
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

describe("backend health boundary", () => {
  it("serves liveness and readiness without external dependencies", async () => {
    const baseUrl = await runningServer();

    const [live, ready, aggregate] = await Promise.all([
      fetch(`${baseUrl}/health/live`),
      fetch(`${baseUrl}/health/ready`),
      fetch(`${baseUrl}/health`)
    ]);

    expect(live.status).toBe(200);
    expect(ready.status).toBe(200);
    expect(aggregate.status).toBe(200);
    await expect(live.json()).resolves.toMatchObject({ live: true, ready: true, status: "ok" });
    await expect(ready.json()).resolves.toMatchObject({ live: true, ready: true, state: "ok" });
  });

  it("returns 503 when an injected readiness check fails", async () => {
    const baseUrl = await runningServer({
      readinessChecks: [{ name: "dependency", check: () => false }]
    });

    const response = await fetch(`${baseUrl}/health/ready`);
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({ ready: false, state: "down" });
  });

  it("does not expose a mutation route", async () => {
    const baseUrl = await runningServer();
    const response = await fetch(`${baseUrl}/health`, { method: "POST" });

    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("GET, HEAD");
    await expect(response.json()).resolves.toEqual({ error: "method_not_allowed" });
  });
});
