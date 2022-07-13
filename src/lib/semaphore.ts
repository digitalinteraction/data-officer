import { log } from "../../deps.ts";

export function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export interface LockOptions {
  maxRetries: number;
  retryInterval: number;
  setTimeout?(fn: (...args: unknown[]) => void, ms: number): void;
}

export async function getLockOrWait(
  isUnlocked: () => Promise<boolean> | boolean,
  { maxRetries, retryInterval, setTimeout = globalThis.setTimeout }:
    LockOptions,
): Promise<"aquired_lock" | "waited" | "failed"> {
  if (await isUnlocked()) {
    log.debug("#retryUntil aquired lock");
    return "aquired_lock";
  }

  for (let i = 1; i < maxRetries; i++) {
    if (await isUnlocked()) return "waited";

    log.debug(`#retryUntil attempt=${i} wait=${retryInterval}`);
    await new Promise((resolve) => setTimeout(resolve, retryInterval));
  }

  log.debug("#retryUntil failed");
  return "failed";
}
