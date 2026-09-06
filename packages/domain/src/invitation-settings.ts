export const delayModes = ["fixed", "random"] as const;

export type DelayMode = (typeof delayModes)[number];

export interface InvitationSettings {
  readonly invitationsEnabled: boolean;
  readonly dailyLimit: number;
  readonly taskLimit: number;
  readonly delayMode: DelayMode;
  readonly fixedDelaySeconds: number;
  readonly minDelaySeconds: number;
  readonly maxDelaySeconds: number;
  readonly scheduleEnabled: boolean;
  readonly scheduleStart?: string;
  readonly scheduleEnd?: string;
  readonly activeDays: readonly number[];
  readonly pausedUntil?: string;
  readonly floodWaitUntil?: string;
}

/** Defaults are copied at account creation; they are not a live global override. */
export const safeDefaultInvitationSettings: InvitationSettings = {
  invitationsEnabled: false,
  dailyLimit: 0,
  taskLimit: 0,
  delayMode: "fixed",
  fixedDelaySeconds: 0,
  minDelaySeconds: 0,
  maxDelaySeconds: 0,
  scheduleEnabled: false,
  activeDays: []
};
