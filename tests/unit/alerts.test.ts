import { describe, expect, it } from "vitest";
import { createThrottle } from "@/lib/alerts";

describe("createThrottle", () => {
  it("allows the first call, then at most once per interval", () => {
    const t = createThrottle(60_000);
    expect(t.tryAcquire(1_000_000)).toBe(true);
    expect(t.tryAcquire(1_000_000 + 1)).toBe(false);
    expect(t.tryAcquire(1_000_000 + 59_999)).toBe(false);
    expect(t.tryAcquire(1_000_000 + 60_000)).toBe(true);
    expect(t.tryAcquire(1_000_000 + 60_001)).toBe(false);
  });
  it("keeps separate state per throttle", () => {
    const a = createThrottle(1000);
    const b = createThrottle(1000);
    expect(a.tryAcquire(5)).toBe(true);
    expect(b.tryAcquire(5)).toBe(true);
  });
});
