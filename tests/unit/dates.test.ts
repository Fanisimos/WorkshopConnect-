import { describe, expect, it } from "vitest";

import { formatTimeRange, ukLocalToUtcIso, utcIsoToUkLocal } from "@/lib/dates";

describe("ukLocalToUtcIso", () => {
  it("treats winter times as GMT (UTC+0)", () => {
    expect(ukLocalToUtcIso("2026-11-12", "14:00")).toBe("2026-11-12T14:00:00.000Z");
  });

  it("treats summer times as BST (UTC+1)", () => {
    expect(ukLocalToUtcIso("2026-06-15", "09:30")).toBe("2026-06-15T08:30:00.000Z");
  });

  it("handles the day the clocks go forward (29 Mar 2026)", () => {
    expect(ukLocalToUtcIso("2026-03-29", "00:30")).toBe("2026-03-29T00:30:00.000Z"); // still GMT
    expect(ukLocalToUtcIso("2026-03-29", "03:00")).toBe("2026-03-29T02:00:00.000Z"); // now BST
  });

  it("handles the day the clocks go back (25 Oct 2026)", () => {
    expect(ukLocalToUtcIso("2026-10-25", "00:30")).toBe("2026-10-24T23:30:00.000Z"); // still BST
    expect(ukLocalToUtcIso("2026-10-25", "03:00")).toBe("2026-10-25T03:00:00.000Z"); // now GMT
  });

  it.each([
    ["impossible date", "2026-02-30", "10:00"],
    ["bad time", "2026-11-12", "25:00"],
    ["wrong format", "12/11/2026", "10:00"],
    ["empty", "", ""],
  ])("rejects %s", (_label, date, time) => {
    expect(ukLocalToUtcIso(date, time)).toBeNull();
  });
});

describe("utcIsoToUkLocal", () => {
  it("round-trips with ukLocalToUtcIso in summer and winter", () => {
    for (const [date, time] of [
      ["2026-06-15", "09:30"],
      ["2026-12-01", "18:45"],
    ]) {
      expect(utcIsoToUkLocal(ukLocalToUtcIso(date, time)!)).toEqual({ date, time });
    }
  });
});

describe("formatTimeRange", () => {
  it("formats in UK local time", () => {
    expect(formatTimeRange("2026-06-15T08:30:00Z", "2026-06-15T10:00:00Z")).toBe("Mon 15 Jun 2026, 09:30–11:00");
  });
});
