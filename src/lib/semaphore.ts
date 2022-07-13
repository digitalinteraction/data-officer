export function randomNumberBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export async function waitForSemaphore(
  isLocked: () => Promise<boolean>,
  maxRetries: number,
  retryInterval: number,
): Promise<void> {
  let retries = maxRetries;

  for (let i = 0; i < retries; i++) {
    const lock = await isLocked();
    if (lock) return;

    await new Promise((resolve) => setTimeout(resolve, retryInterval));
    retries--;
  }

  throw new Error("Failed to wait for semaphore");
}
