import type { WorkerCommandEnvelope } from "@invait/contracts";
import type { WorkerCommandHandler } from "../types/index.js";

export type TaskLifecycleStatus = "RUNNING" | "COMPLETED" | "FAILED";
export interface TaskStatePort { setStatus(taskId: string, status: TaskLifecycleStatus, details?: { readonly error?: string; readonly progress?: Record<string, unknown> }): Promise<void>; }
export interface TaskExecutorPort { execute(taskId: string): Promise<Record<string, unknown>>; }
export interface TaskHandlersOptions { readonly state: TaskStatePort; readonly executor: TaskExecutorPort; }
function taskIdOf(command: WorkerCommandEnvelope): string { const payload = command.payload; if (typeof payload !== "object" || payload === null || !("taskId" in payload) || typeof payload.taskId !== "string") throw new Error("task_id_required"); return payload.taskId; }
export function createTaskHandlers(options: TaskHandlersOptions): { readonly PROCESS_TASK: WorkerCommandHandler } { return { PROCESS_TASK: async (command) => { const taskId = taskIdOf(command); await options.state.setStatus(taskId, "RUNNING"); try { const result = await options.executor.execute(taskId); await options.state.setStatus(taskId, "COMPLETED", { progress: result }); return result; } catch (error) { await options.state.setStatus(taskId, "FAILED", { error: error instanceof Error ? error.name : "task_failed" }); throw error; } } }; }
