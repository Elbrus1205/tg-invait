import type {
  CommandQueuePort,
  EnqueuedCommand,
  WorkerCommandEnvelope
} from "@invait/contracts";

import { assertCommandEnvelope } from "./command-queue.js";

/**
 * Deterministic queue adapter used by smoke tests and local development.
 * It has no network or Telegram side effects and can be replaced by BullMQ in
 * a later stage without changing callers.
 */
export class InMemoryCommandQueue implements CommandQueuePort {
  private readonly pending: WorkerCommandEnvelope<unknown>[] = [];
  private readonly seenIds = new Set<string>();

  public async enqueue<TPayload>(
    command: WorkerCommandEnvelope<TPayload>
  ): Promise<EnqueuedCommand> {
    assertCommandEnvelope(command);
    if (this.seenIds.has(command.id)) {
      throw new Error(`Command ${command.id} has already been enqueued`);
    }

    this.seenIds.add(command.id);
    this.pending.push(command as WorkerCommandEnvelope<unknown>);
    return { jobId: command.id };
  }

  public dequeue(): WorkerCommandEnvelope<unknown> | undefined {
    return this.pending.shift();
  }

  public get size(): number {
    return this.pending.length;
  }

  public clear(): void {
    this.pending.length = 0;
    this.seenIds.clear();
  }
}
