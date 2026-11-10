import { describe, expect, it } from "vitest";

import { workshopPhase } from "@/features/workshops/phase";
import { canTransition, parseFocusTopics, workshopFormSchema } from "@/features/workshops/schema";

const validForm = {
  title: "Intro to SQL",
  description: "Hands-on session.",
  date: "2026-11-12",
  startTime: "14:00",
  endTime: "16:00",
  location: "Room 101",
  focusTopics: "SQL JOINs, GROUP BY",
  status: "published",
};

describe("parseFocusTopics", () => {
  it("splits, trims and de-duplicates (case-insensitive)", () => {
    expect(parseFocusTopics(" SQL JOINs, group   by,\nSubqueries , sql joins,, ")).toEqual([
      "SQL JOINs",
      "group by",
      "Subqueries",
    ]);
  });

  it("returns an empty list for blank input", () => {
    expect(parseFocusTopics("  ,  ")).toEqual([]);
  });
});

describe("workshopFormSchema", () => {
  it("converts UK local times to UTC database columns", () => {
    const out = workshopFormSchema.parse(validForm);
    expect(out).toMatchObject({
      title: "Intro to SQL",
      starts_at: "2026-11-12T14:00:00.000Z",
      ends_at: "2026-11-12T16:00:00.000Z",
      focus_topics: ["SQL JOINs", "GROUP BY"],
      status: "published",
    });
  });

  it("defaults to draft when no status is sent", () => {
    const { status, ...withoutStatus } = validForm;
    void status;
    expect(workshopFormSchema.parse(withoutStatus).status).toBe("draft");
  });

  it("rejects a status other than draft/published on create", () => {
    expect(workshopFormSchema.safeParse({ ...validForm, status: "completed" }).success).toBe(false);
  });

  it("rejects an end time before the start time", () => {
    const result = workshopFormSchema.safeParse({ ...validForm, endTime: "13:00" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["endTime"]);
  });

  it("rejects more than 8 focus topics", () => {
    const result = workshopFormSchema.safeParse({ ...validForm, focusTopics: "a,b,c,d,e,f,g,h,i" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path[0]).toBe("focusTopics");
  });

  it("rejects a short title and missing location", () => {
    const result = workshopFormSchema.safeParse({ ...validForm, title: "Hi", location: " " });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.path[0]).sort()).toEqual(["location", "title"]);
  });
});

describe("status transitions", () => {
  it("allows the normal lifecycle", () => {
    expect(canTransition("draft", "published")).toBe(true);
    expect(canTransition("published", "completed")).toBe(true);
    expect(canTransition("published", "cancelled")).toBe(true);
    expect(canTransition("cancelled", "published")).toBe(true);
  });

  it("never un-publishes back to draft", () => {
    expect(canTransition("published", "draft")).toBe(false);
    expect(canTransition("completed", "draft")).toBe(false);
  });
});

describe("workshopPhase", () => {
  const w = { status: "published" as const, starts_at: "2026-11-12T14:00:00Z", ends_at: "2026-11-12T16:00:00Z" };

  it("is upcoming before, live during and ended after", () => {
    expect(workshopPhase(w, new Date("2026-11-12T13:59:00Z"))).toBe("upcoming");
    expect(workshopPhase(w, new Date("2026-11-12T15:00:00Z"))).toBe("live");
    expect(workshopPhase(w, new Date("2026-11-12T16:01:00Z"))).toBe("ended");
  });

  it("respects cancelled and completed statuses", () => {
    expect(workshopPhase({ ...w, status: "cancelled" }, new Date("2026-11-12T15:00:00Z"))).toBe("cancelled");
    expect(workshopPhase({ ...w, status: "completed" }, new Date("2026-11-12T15:00:00Z"))).toBe("ended");
  });
});
