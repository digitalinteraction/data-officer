export const DEFAULT_HTTP_TIMEOUT = 10_000;

/** A custom version of fetch which adds a timeout */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number } = {},
) {
  const { timeout = DEFAULT_HTTP_TIMEOUT } = options;

  // Use an abort controller to stop the request if the timeout occurs
  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), timeout);

  // Run the fetch request with the original options and pass the abort controller
  const result = await fetch(url, {
    ...options,
    signal: controller.signal,
  });

  // If we got to hear, the timeout didn't occur and the request completed
  // so clear the timeout
  clearTimeout(timerId);

  return result;
}
