import { Worker as BullWorker } from "bullmq";
import type { WorkerCommandEnvelope } from "@invait/contracts";
import type { WorkerCommandConsumer, WorkerCommandHandler, WorkerCommandSubscription } from "../types/index.js";

export interface BullMqCommandConsumerOptions { readonly redisUrl: string; readonly queueName?: string; readonly workerName?: string; readonly concurrency?: number; }
export function assertCommandHandled(result: unknown): void {
  if (typeof result === "object" && result !== null && "status" in result) {
    const status = (result as { readonly status?: unknown }).status;
    if (status === "deferred" || status === "rejected") throw new Error(`command_${status}`);
  }
}
export class BullMqCommandConsumer implements WorkerCommandConsumer {
  private worker: BullWorker<WorkerCommandEnvelope> | undefined;
  public constructor(private readonly options: BullMqCommandConsumerOptions) {}
  public async consume(handler: WorkerCommandHandler): Promise<WorkerCommandSubscription> {
    if (this.worker) throw new Error("command_consumer_already_started");
    const worker = new BullWorker<WorkerCommandEnvelope>(this.options.queueName ?? "telegram-commands", async (job) => {
      const result = await handler(job.data);
      assertCommandHandled(result);
    }, { connection: { url: this.options.redisUrl }, concurrency: this.options.concurrency ?? 1, ...(this.options.workerName === undefined ? {} : { name: this.options.workerName }) });
    this.worker = worker;
    await new Promise<void>((resolve, reject) => { const onReady = () => { worker.off("error", onError); resolve(); }; const onError = (error: Error) => { worker.off("ready", onReady); reject(error); }; worker.once("ready", onReady); worker.once("error", onError); });
    return { close: async () => { const current = this.worker; this.worker = undefined; if (current) await current.close(); } };
  }
}
