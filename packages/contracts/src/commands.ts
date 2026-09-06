export const workerCommandTypes = [
  "CONNECT_ACCOUNT",
  "DISCONNECT_ACCOUNT",
  "SEND_MESSAGE",
  "LOAD_DIALOGS",
  "LOAD_MESSAGES",
  "LOAD_CONTACTS",
  "CHANGE_PROXY",
  "IMPORT_TDATA",
  "PROCESS_TASK",
  "PROCESS_INVITATION_ITEM",
  "HEALTH_CHECK"
] as const;

export type WorkerCommandType = (typeof workerCommandTypes)[number];

export interface WorkerCommandEnvelope<TPayload = unknown> {
  readonly id: string;
  readonly type: WorkerCommandType;
  readonly accountId?: string;
  readonly requestedBy?: string;
  readonly payload: TPayload;
  readonly createdAt: string;
  readonly attempt: number;
}

export interface EnqueuedCommand {
  readonly jobId: string;
}

export interface CommandQueuePort {
  enqueue<TPayload>(command: WorkerCommandEnvelope<TPayload>): Promise<EnqueuedCommand>;
}
