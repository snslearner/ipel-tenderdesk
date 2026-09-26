import { describe, expect, it } from "vitest";
import { ROLES, isRole, roleLabel } from "@/lib/auth/roles";

describe("roles", () => {
  it("has exactly the five brief roles", () => {
    expect(ROLES).toEqual(["owner", "tender", "purchase", "accounts", "logistics"]);
  });

  it("recognises valid roles only", () => {
    expect(isRole("owner")).toBe(true);
    expect(isRole("logistics")).toBe(true);
    expect(isRole("admin")).toBe(false);
    expect(isRole(null)).toBe(false);
    expect(isRole(undefined)).toBe(false);
  });

  it("labels roles for display", () => {
    expect(roleLabel("owner")).toBe("Owner");
    expect(roleLabel("accounts")).toBe("Accounts");
    expect(roleLabel("unknown")).toBe("No role");
    expect(roleLabel(null)).toBe("No role");
  });
});
