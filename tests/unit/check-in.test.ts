import { describe, expect, it } from "vitest";

import { checkInUrl, checkInWindow, parseCheckInResult } from "@/features/attendance/check-in-result";

describe("parseCheckInResult", () => {
  it("accepts every status the database can return", () => {
    for (const status of ["checked_in", "already_checked_in", "invalid", "closed", "not_student"]) {
      expect(parseCheckInResult({ status }).status).toBe(status);
    }
  });

  it("keeps workshop details", () => {
    const id = "0b6f1c2e-1111-4a4a-9999-000000000000";
    expect(parseCheckInResult({ status: "checked_in", workshop_id: id, workshop_title: "SQL" })).toEqual({
      status: "checked_in",
      workshop_id: id,
      workshop_title: "SQL",
    });
  });

  it.each([null, undefined, "checked_in", { status: "hacked" }, { status: "checked_in", workshop_id: "nope" }])(
    "treats unexpected data (%j) as invalid, never as success",
    (raw) => {
      expect(parseCheckInResult(raw).status).toBe("invalid");
    },
  );
});

describe("checkInWindow", () => {
  it("opens 30 minutes before the start and closes 60 minutes after the end", () => {
    const { opensAt, closesAt } = checkInWindow("2026-11-12T14:00:00Z", "2026-11-12T16:00:00Z");
    expect(opensAt.toISOString()).toBe("2026-11-12T13:30:00.000Z");
    expect(closesAt.toISOString()).toBe("2026-11-12T17:00:00.000Z");
  });
});

describe("checkInUrl", () => {
  it("builds the URL encoded in the QR code", () => {
    expect(checkInUrl("https://example.netlify.app/", "abc")).toBe("https://example.netlify.app/check-in/abc");
  });
});
