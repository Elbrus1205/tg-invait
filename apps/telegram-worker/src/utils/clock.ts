import type { WorkerClock } from "../types/index.js";

export const systemClock: WorkerClock = {
  now: () => new Date()
};

export function isoNow(clock: WorkerClock = systemClock): string {
  return clock.now().toISOString();
}
