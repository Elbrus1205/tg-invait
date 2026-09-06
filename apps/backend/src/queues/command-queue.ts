import type {
  CommandQueuePort,
  EnqueuedCommand,
  WorkerCommandEnvelope,
  WorkerCommandType
} from "@invait/contracts";
import { randomUUID } from "node:crypto";

export type {
  CommandQueuePort,
  EnqueuedCommand,
  WorkerCommandEnvelope,
  WorkerCommandType
} from "@invait/contracts";

export interface CommandEnvelopeInput<TPayload> {
  readonly type: WorkerCommandType;
  readonly payload: TPayload;
  readonly id?: string;
  readonly accountId?: string;
  readonly requestedBy?: string;
  readonly createdAt?: string;
  readonly attempt?: number;
}

export function createCommandEnvelope<TPayload>(
  input: CommandEnvelopeInput<TPayload>,
  options: { readonly idFactory?: () => string; readonly now?: () => Date } = {}
): WorkerCommandEnvelope<TPayload> {
  const id = input.id?.trim() || (options.idFactory ?? randomUUID)();
  const createdAt = input.createdAt ?? (options.now ?? (() => new Date()))().toISOString();
  const attempt = input.attempt ?? 0;

  return {
    id,
    type: input.type,
    payload: input.payload,
    createdAt,
    attempt,
    ...(input.accountId === undefined ? {} : { accountId: input.accountId }),
    ...(input.requestedBy === undefined ? {} : { requestedBy: input.requestedBy })
  };
}

export function assertCommandEnvelope<TPayload>(
  command: WorkerCommandEnvelope<TPayload>
): void {
  if (command.id.trim().length === 0 || command.id.length > 128) {
    throw new TypeError("Command id must be between 1 and 128 characters");
  }
  if (command.type.trim().length === 0) {
    throw new TypeError("Command type must not be empty");
  }
  if (!Number.isInteger(command.attempt) || command.attempt < 0) {
    throw new TypeError("Command attempt must be a non-negative integer");
  }
  if (Number.isNaN(Date.parse(command.createdAt))) {
    throw new TypeError("Command createdAt must be an ISO-compatible date");
  }
}

export type BackendCommandQueue = CommandQueuePort;
export type BackendEnqueuedCommand = EnqueuedCommand;
