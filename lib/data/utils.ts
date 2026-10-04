/**
 * Resilient async helper with timeout and fallback protection.
 * Prevents database hiccups, timeouts, and unhandled rejections from freezing or crashing pages.
 */
export async function safeAsync<T>(
  promise: Promise<T>,
  fallback: T,
  timeoutMs = 7000
): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => {
      console.warn(`Query timed out after ${timeoutMs}ms, resolving fallback.`);
      resolve(fallback);
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([
      promise.then((val) => {
        if (timer) clearTimeout(timer);
        return val;
      }),
      timeoutPromise,
    ]);
    return result;
  } catch (err) {
    if (timer) clearTimeout(timer);
    console.error("Safe query caught error, resolving fallback:", err);
    return fallback;
  }
}
