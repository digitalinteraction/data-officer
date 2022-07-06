export const DEFAULT_HTTP_TIMEOUT = 10_000;

export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number } = {},
) {
  const { timeout = DEFAULT_HTTP_TIMEOUT } = options;
  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), timeout);

  const result = await fetch(url, {
    signal: controller.signal,
  });
  clearTimeout(timerId);
  return result;
}
