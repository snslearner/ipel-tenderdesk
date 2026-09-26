import { describe, expect, it, vi } from "vitest";
import { isJwtSkewError, withJwtSkewRetry } from "@/lib/auth/jwt-skew-retry";

const skew = { data: null, error: { message: "JWT issued at future" } };
const ok = { data: "owner", error: null };

describe("isJwtSkewError", () => {
  it("matches only the clock-skew message", () => {
    expect(isJwtSkewError({ message: "JWT issued at future" })).toBe(true);
    expect(isJwtSkewError({ message: "jwt issued at future" })).toBe(true);
    expect(isJwtSkewError({ message: "JWT expired" })).toBe(false);
    expect(isJwtSkewError(null)).toBe(false);
  });
});

describe("withJwtSkewRetry", () => {
  it("returns the first result when there is no error", async () => {
    const call = vi.fn().mockResolvedValue(ok);
    const sleep = vi.fn().mockResolvedValue(undefined);
    await expect(withJwtSkewRetry(call, { sleep })).resolves.toBe(ok);
    expect(call).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it("retries after ~1s on clock skew and returns the success", async () => {
    const call = vi.fn().mockResolvedValueOnce(skew).mockResolvedValueOnce(skew).mockResolvedValue(ok);
    const sleep = vi.fn().mockResolvedValue(undefined);
    await expect(withJwtSkewRetry(call, { sleep })).resolves.toBe(ok);
    expect(call).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(1000);
  });

  it("gives up after 3 retries and returns the last skew error", async () => {
    const call = vi.fn().mockResolvedValue(skew);
    const sleep = vi.fn().mockResolvedValue(undefined);
    await expect(withJwtSkewRetry(call, { sleep })).resolves.toBe(skew);
    expect(call).toHaveBeenCalledTimes(4); // 1 attempt + 3 retries
    expect(sleep).toHaveBeenCalledTimes(3);
  });

  it("does not retry other errors", async () => {
    const other = { data: null, error: { message: "permission denied" } };
    const call = vi.fn().mockResolvedValue(other);
    const sleep = vi.fn().mockResolvedValue(undefined);
    await expect(withJwtSkewRetry(call, { sleep })).resolves.toBe(other);
    expect(call).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });
});
