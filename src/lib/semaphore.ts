import { log } from "../../deps.ts";

/** Pick a random number between two other numbers */
export function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

/** Options for requesting a semaphore */
export interface LockOptions {
  /** The maximum amount of times it will retry after the `retryInterval` */
  maxRetries: number;

  /** How long to wait between retries */
  retryInterval: number;

  /** A method to wait for a duration (exposed to ease unit-testing) */
  setTimeout?(fn: (...args: unknown[]) => void, ms: number): void;
}

/**
 * Request a lock under a certain key in Redis. If the lock is already set,
 * it will wait for the lock to be released instead.
 *
 * It will wait for a max of `maxRetries x retryInterval`, stopping at each
 * interval to see if the lock is released yet.
 *
 * It returns the state of the lock or whether it was waited to be released.
 *
 * @param isUnlocked An async method  to determine if the lock is aquired or not.
 */
export async function getLockOrWait(
  isUnlocked: () => Promise<boolean> | boolean,
  { maxRetries, retryInterval, setTimeout = globalThis.setTimeout }:
    LockOptions,
): Promise<"aquired_lock" | "waited" | "failed"> {
  // If not locked, return straight away
  if (await isUnlocked()) {
    log.debug("#retryUntil aquired lock");
    return "aquired_lock";
  }

  // If locked, wait for `retryInterval` and try again,
  // up to a maximum of `maxRetries` times
  for (let i = 1; i < maxRetries; i++) {
    log.debug(`#retryUntil attempt=${i} wait=${retryInterval}`);
    await new Promise((resolve) => setTimeout(resolve, retryInterval));

    if (await isUnlocked()) return "waited";
  }

  // If we got to here, the lock was failed to be aquired
  log.debug("#retryUntil failed");
  return "failed";
}
