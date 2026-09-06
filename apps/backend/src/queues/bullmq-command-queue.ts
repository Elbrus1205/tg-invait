import { Queue } from "bullmq";
import type { CommandQueuePort, EnqueuedCommand, WorkerCommandEnvelope } from "@invait/contracts";
import { assertCommandEnvelope } from "./command-queue.js";

export interface BullMqCommandQueueOptions { readonly redisUrl: string; readonly queueName?: string; }
export class BullMqCommandQueue implements CommandQueuePort {
  private readonly queue: Queue<WorkerCommandEnvelope>;
  public constructor(options: BullMqCommandQueueOptions) { this.queue = new Queue(options.queueName ?? "telegram-commands", { connection: { url: options.redisUrl } }); }
  public async enqueue<TPayload>(command: WorkerCommandEnvelope<TPayload>): Promise<EnqueuedCommand> { assertCommandEnvelope(command); await this.queue.add(command.type, command as WorkerCommandEnvelope, { jobId: command.id, removeOnComplete: 1000, removeOnFail: 5000 }); return { jobId: command.id }; }
  public async close(): Promise<void> { await this.queue.close(); }
}
