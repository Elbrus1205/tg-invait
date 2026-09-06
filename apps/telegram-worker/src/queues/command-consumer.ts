import type { WorkerCommandEnvelope } from "@invait/contracts";
import type {
  WorkerCommandConsumer,
  WorkerCommandHandler,
  WorkerCommandSubscription
} from "../types/index.js";

/**
 * Deterministic queue seam for tests and local composition. Production uses
 * the BullMQ adapter without changing worker command handlers.
 */
export class InMemoryCommandConsumer implements WorkerCommandConsumer {
  private handler: WorkerCommandHandler | undefined;
  private closed = false;
  private readonly pending: WorkerCommandEnvelope[] = [];

  public async consume(handler: WorkerCommandHandler): Promise<WorkerCommandSubscription> {
    this.handler = handler;
    this.closed = false;
    await this.flush();
    return {
      close: () => {
        this.closed = true;
        this.handler = undefined;
      }
    };
  }

  public async push(command: WorkerCommandEnvelope): Promise<void> {
    if (!this.handler || this.closed) {
      this.pending.push(command);
      return;
    }
    await this.handler(command);
  }

  private async flush(): Promise<void> {
    const handler = this.handler;
    if (!handler || this.closed) {
      return;
    }

    while (this.pending.length > 0 && !this.closed) {
      const command = this.pending.shift();
      if (command) {
        await handler(command);
      }
    }
  }
}
