import { describe, expect, it } from "vitest";
import { expiryState, formatDate, formatINR, formatINRCompact, formatPct, todayIST } from "@/lib/format";

describe("formatINR", () => {
  it("uses Indian digit grouping", () => {
    expect(formatINR(12345678.9)).toBe("₹1,23,45,678.90");
    expect(formatINR(0)).toBe("₹0.00");
  });
  it("shows a dash for missing values", () => {
    expect(formatINR(null)).toBe("—");
    expect(formatINR(undefined)).toBe("—");
  });
});

describe("formatINRCompact", () => {
  it("abbreviates crore and lakh", () => {
    expect(formatINRCompact(196851580.46)).toBe("₹19.69 Cr");
    expect(formatINRCompact(10000000)).toBe("₹1.00 Cr");
    expect(formatINRCompact(2073111.2)).toBe("₹20.73 L");
    expect(formatINRCompact(100000)).toBe("₹1.00 L");
    // v_dashboard_kpis.bg_live_value on the seed data: about ₹7.71 Cr, not ₹771 Cr.
    expect(formatINRCompact(77070322.3)).toBe("₹7.71 Cr");
  });
  it("shows smaller amounts in full rupees", () => {
    expect(formatINRCompact(99999)).toBe("₹99,999");
    expect(formatINRCompact(0)).toBe("₹0");
  });
  it("keeps the sign for negatives and dashes nulls", () => {
    expect(formatINRCompact(-2500000)).toBe("-₹25.00 L");
    expect(formatINRCompact(null)).toBe("—");
  });
});

describe("formatPct", () => {
  it("formats one decimal and dashes nulls", () => {
    expect(formatPct(15.4)).toBe("15.4%");
    expect(formatPct(11)).toBe("11.0%");
    expect(formatPct(null)).toBe("—");
  });
});

describe("formatDate", () => {
  it("formats date-only strings without shifting the day", () => {
    expect(formatDate("2026-10-05")).toBe("05 Oct 2026");
    expect(formatDate("2026-04-01")).toBe("01 Apr 2026");
    expect(formatDate(null)).toBe("—");
  });
});

describe("todayIST", () => {
  it("returns the Asia/Kolkata calendar date", () => {
    // 20:00 UTC on 26 Sep is 01:30 IST on 27 Sep.
    expect(todayIST(new Date("2026-09-26T20:00:00Z"))).toBe("2026-09-27");
    expect(todayIST(new Date("2026-09-26T10:00:00Z"))).toBe("2026-09-26");
  });
});

describe("expiryState", () => {
  const today = "2026-09-26";
  it("flags within 30 days (inclusive) as soon", () => {
    expect(expiryState("2026-09-26", today)).toBe("soon");
    expect(expiryState("2026-10-26", today)).toBe("soon");
    expect(expiryState("2026-10-27", today)).toBe("ok");
  });
  it("handles expired and missing dates", () => {
    expect(expiryState("2026-09-25", today)).toBe("expired");
    expect(expiryState(null, today)).toBe("none");
  });
});
