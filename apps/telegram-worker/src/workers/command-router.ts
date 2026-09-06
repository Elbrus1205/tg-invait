import {
  workerCommandTypes,
  type WorkerCommandEnvelope,
  type WorkerCommandType
} from "@invait/contracts";
import type {
  WorkerCommandHandler,
  WorkerCommandRouteResult
} from "../types/index.js";

export type WorkerCommandHandlerMap = Partial<
  Record<WorkerCommandType, WorkerCommandHandler>
>;

export function isWorkerCommandType(value: unknown): value is WorkerCommandType {
  return (
    typeof value === "string" &&
    (workerCommandTypes as readonly string[]).includes(value)
  );
}

/**
 * Routes immutable commands to worker-facing handlers.
 *
 * The router deliberately has no Telegram implementation. An unconfigured
 * route is reported as deferred so a Stage 1 worker cannot accidentally claim
 * that an external Telegram operation was performed.
 */
export class CommandRouter {
  private readonly handlers = new Map<WorkerCommandType, WorkerCommandHandler>();

  public constructor(handlers: WorkerCommandHandlerMap = {}) {
    for (const commandType of workerCommandTypes) {
      const handler = handlers[commandType];
      if (handler) {
        this.handlers.set(commandType, handler);
      }
    }
  }

  public register(
    commandType: WorkerCommandType,
    handler: WorkerCommandHandler
  ): this {
    this.handlers.set(commandType, handler);
    return this;
  }

  public has(commandType: WorkerCommandType): boolean {
    return this.handlers.has(commandType);
  }

  public async dispatch(
    command: WorkerCommandEnvelope
  ): Promise<WorkerCommandRouteResult> {
    if (!isWorkerCommandType(command.type)) {
      return {
        commandId: command.id,
        type: command.type,
        status: "rejected",
        reason: "unknown_command_type"
      };
    }

    const handler = this.handlers.get(command.type);
    if (!handler) {
      return {
        commandId: command.id,
        type: command.type,
        status: "deferred",
        reason: "handler_not_configured"
      };
    }

    const result = await handler(command);
    if (typeof result === "object" && result !== null && "state" in result) {
      const state = (result as { readonly state?: unknown; readonly reason?: unknown }).state;
      if (state === "deferred") {
        const reason = (result as { readonly reason?: unknown }).reason;
        return {
        commandId: command.id,
        type: command.type,
        status: "deferred",
        reason: typeof reason === "string" ? reason : "handler_deferred"
        };
      }
    }
    if (typeof result === "undefined") {
      return {
        commandId: command.id,
        type: command.type,
        status: "completed"
      };
    }

    return {
      commandId: command.id,
      type: command.type,
      status: "completed",
      result
    };
  }

  public route(command: WorkerCommandEnvelope): Promise<WorkerCommandRouteResult> {
    return this.dispatch(command);
  }
}

export function createCommandRouter(
  handlers: WorkerCommandHandlerMap = {}
): CommandRouter {
  return new CommandRouter(handlers);
}
