type ResultWithError = { error: { message: string } | null };

// Right after sign-in, Supabase Auth can stamp the token a moment ahead of the
// database clock, and PostgREST rejects it with "JWT issued at future".
export function isJwtSkewError(error: { message: string } | null): boolean {
  return !!error && /jwt issued at future/i.test(error.message);
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// Retries `call` on that error only, up to `retries` times, `delayMs` apart.
// Returns the last result either way so the caller handles the error as usual.
export async function withJwtSkewRetry<T extends ResultWithError>(
  call: () => PromiseLike<T>,
  { retries = 3, delayMs = 1000, sleep = wait }: { retries?: number; delayMs?: number; sleep?: (ms: number) => Promise<void> } = {},
): Promise<T> {
  let result = await call();
  for (let attempt = 0; attempt < retries && isJwtSkewError(result.error); attempt++) {
    await sleep(delayMs);
    result = await call();
  }
  return result;
}
