import { describe, expect, it } from "vitest";
import {
  BOARD_STATUSES,
  ENQUIRY_SOURCES,
  SOURCE_LABEL,
  enquiryRef,
  followUpChannel,
  nextStage,
} from "@/lib/tenders";

describe("sources", () => {
  it("labels every database source", () => {
    expect(SOURCE_LABEL.phone_call).toBe("Phone call");
    expect(SOURCE_LABEL.whatsapp).toBe("WhatsApp");
    expect(SOURCE_LABEL.referral).toBe("Referral");
    expect(SOURCE_LABEL.client_email).toBe("Email");
    expect(SOURCE_LABEL.gem).toBe("GeM");
    expect(SOURCE_LABEL.cppp).toBe("CPPP");
    expect(Object.keys(SOURCE_LABEL)).toHaveLength(8);
  });
  it("offers the seven enquiry sources, leads first", () => {
    expect(ENQUIRY_SOURCES.map((s) => SOURCE_LABEL[s])).toEqual([
      "Phone call", "WhatsApp", "Referral", "Email", "Portal", "GeM", "CPPP",
    ]);
  });
  it("maps each source to a follow-up channel", () => {
    expect(followUpChannel("phone_call")).toBe("call");
    expect(followUpChannel("whatsapp")).toBe("call");
    expect(followUpChannel("referral")).toBe("call");
    expect(followUpChannel("client_email")).toBe("email");
    expect(followUpChannel("gem")).toBe("email");
  });
});

describe("board", () => {
  it("has the seven stage columns in order", () => {
    expect(BOARD_STATUSES).toEqual(["identified", "evaluation", "preparation", "owner_review", "submitted", "won", "lost"]);
  });
  it("moves one stage forward until submitted; results are chosen, not 'next'", () => {
    expect(nextStage("identified")).toBe("evaluation");
    expect(nextStage("evaluation")).toBe("preparation");
    expect(nextStage("preparation")).toBe("owner_review");
    expect(nextStage("owner_review")).toBe("submitted");
    expect(nextStage("submitted")).toBeNull();
    expect(nextStage("won")).toBeNull();
    expect(nextStage("lost")).toBeNull();
  });
});

describe("enquiryRef", () => {
  it("builds ENQ-YYMMDD-XXXX in IST", () => {
    // 20:00 UTC on 26 Sep is 27 Sep in India.
    expect(enquiryRef(new Date("2026-09-26T20:00:00Z"), () => 0.5)).toMatch(/^ENQ-260927-[0-9A-Z]{4}$/);
  });
  it("uses the random source for the suffix", () => {
    const a = enquiryRef(new Date("2026-09-26T10:00:00Z"), () => 0.1);
    const b = enquiryRef(new Date("2026-09-26T10:00:00Z"), () => 0.9);
    expect(a).not.toBe(b);
  });
});
