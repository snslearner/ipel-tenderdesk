// At most one run per interval. The slot is taken before the work starts, so
// concurrent requests on the same server instance don't all run it at once.
export function createThrottle(intervalMs: number) {
  let last = Number.NEGATIVE_INFINITY;
  return {
    tryAcquire(now: number = Date.now()): boolean {
      if (now - last < intervalMs) return false;
      last = now;
      return true;
    },
  };
}
