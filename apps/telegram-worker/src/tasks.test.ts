import { describe, expect, it } from "vitest";
import { createTaskHandlers } from "./workers/tasks.js";

describe("task worker handler", () => {
  it("records durable task state around executor work", async () => {
    const states: string[] = [];
    const handlers = createTaskHandlers({ state: { setStatus: async (_taskId, status) => { states.push(status); } }, executor: { execute: async () => ({ processed: 3 }) } });
    const result = await handlers.PROCESS_TASK({ id: "command-1", type: "PROCESS_TASK", payload: { taskId: "task-1" }, createdAt: new Date().toISOString(), attempt: 0 });
    expect(states).toEqual(["RUNNING", "COMPLETED"]);
    expect(result).toEqual({ processed: 3 });
  });
});
