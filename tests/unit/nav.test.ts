import { describe, expect, it } from "vitest";
import { NAV_ITEMS, MOBILE_PRIMARY, MOBILE_MORE, isActive } from "@/components/shell/nav";

describe("nav", () => {
  it("lists every screen from the brief in order", () => {
    expect(NAV_ITEMS.map((i) => i.label)).toEqual([
      "Dashboard", "Tenders", "Orders", "Vendors", "Clients", "Products", "Reminders", "Settings",
    ]);
  });

  it("puts Dashboard, Tenders, Orders, Reminders on the mobile bar and the rest under More", () => {
    expect(MOBILE_PRIMARY.map((i) => i.label)).toEqual(["Dashboard", "Tenders", "Orders", "Reminders"]);
    expect(MOBILE_MORE.map((i) => i.label)).toEqual(["Vendors", "Clients", "Products", "Settings"]);
  });

  it("matches the active route", () => {
    expect(isActive("/", "/")).toBe(true);
    expect(isActive("/tenders", "/")).toBe(false);
    expect(isActive("/tenders", "/tenders")).toBe(true);
    expect(isActive("/tenders/abc", "/tenders")).toBe(true);
    expect(isActive("/tendersx", "/tenders")).toBe(false);
  });
});
