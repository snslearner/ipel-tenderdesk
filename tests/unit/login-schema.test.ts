import { describe, expect, it } from "vitest";
import { loginSchema } from "@/lib/auth/login-schema";

describe("loginSchema", () => {
  it("accepts a valid email and password", () => {
    const r = loginSchema.safeParse({ email: "tender@example.com", password: "x" });
    expect(r.success).toBe(true);
  });

  it("trims and lower-cases the email", () => {
    const r = loginSchema.parse({ email: "  Tender@Example.com ", password: "x" });
    expect(r.email).toBe("tender@example.com");
  });

  it("rejects a bad email", () => {
    expect(loginSchema.safeParse({ email: "nope", password: "x" }).success).toBe(false);
  });

  it("rejects an empty password", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
  });
});
