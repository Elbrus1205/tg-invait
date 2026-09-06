import { describe, expect, it } from "vitest";

import {
  InMemoryCommandQueue,
  createCommandEnvelope,
  type WorkerCommandEnvelope
} from "../src/index.js";

describe("command queue boundary", () => {
  it("accepts a typed command and returns a stable job id", async () => {
    const queue = new InMemoryCommandQueue();
    const command = createCommandEnvelope({
      id: "command-smoke-1",
      type: "HEALTH_CHECK",
      payload: { requestedBy: "smoke-test" }
    });

    const receipt = await queue.enqueue(command);
    expect(receipt).toEqual({ jobId: "command-smoke-1" });
    expect(queue.size).toBe(1);
    expect(queue.dequeue()).toMatchObject<Partial<WorkerCommandEnvelope>>({
      id: "command-smoke-1",
      type: "HEALTH_CHECK"
    });
  });

  it("rejects duplicate command ids before an adapter is involved", async () => {
    const queue = new InMemoryCommandQueue();
    const command = createCommandEnvelope({
      id: "command-smoke-2",
      type: "HEALTH_CHECK",
      payload: null
    });

    await queue.enqueue(command);
    await expect(queue.enqueue(command)).rejects.toThrow(/already been enqueued/);
  });
});
