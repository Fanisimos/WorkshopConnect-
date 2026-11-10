import { describe, expect, it } from "vitest";

import { feedbackSchema, fulfilSchema, pulseSchema, requestSchema, resourceSchema } from "@/features/engagement/schema";
import { chosenTopic, topicKey } from "@/lib/topics";

const workshopId = "0b6f1c2e-1111-4a4a-9999-000000000000";
const requestId = "1b6f1c2e-2222-4a4a-9999-000000000000";

describe("topics", () => {
  it("groups topics regardless of case and spacing", () => {
    expect(topicKey("  SQL   JOINs ")).toBe(topicKey("sql joins"));
  });

  it("prefers the 'Other' text over a selected chip, and ignores blanks", () => {
    expect(chosenTopic("GROUP BY", "Window functions")).toBe("Window functions");
    expect(chosenTopic("GROUP BY", "   ")).toBe("GROUP BY");
    expect(chosenTopic("__other", "")).toBeNull();
    expect(chosenTopic(undefined, undefined)).toBeNull();
  });
});

describe("feedbackSchema", () => {
  it("accepts a 1-5 rating and an optional comment", () => {
    expect(feedbackSchema.parse({ workshopId, rating: "4", comment: "  Great  " })).toEqual({
      workshopId,
      rating: 4,
      comment: "Great",
    });
    expect(feedbackSchema.parse({ workshopId, rating: "5" }).comment).toBeNull();
  });

  it.each(["0", "6", "3.5", "", "abc"])("rejects rating %j", (rating) => {
    const r = feedbackSchema.safeParse({ workshopId, rating });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.path[0]).toBe("rating");
  });

  it("rejects comments over 1000 characters", () => {
    expect(feedbackSchema.safeParse({ workshopId, rating: "3", comment: "x".repeat(1001) }).success).toBe(false);
  });
});

describe("pulseSchema", () => {
  it("accepts before/after ratings and a chosen topic", () => {
    expect(pulseSchema.parse({ workshopId, confidenceBefore: "2", confidenceAfter: "4", topic: "SQL JOINs" })).toEqual({
      workshopId,
      confidenceBefore: 2,
      confidenceAfter: 4,
      topic: "SQL JOINs",
    });
  });

  it("allows no topic", () => {
    expect(pulseSchema.parse({ workshopId, confidenceBefore: "3", confidenceAfter: "3" }).topic).toBeNull();
  });

  it("requires both confidence ratings", () => {
    const r = pulseSchema.safeParse({ workshopId, confidenceBefore: "3" });
    expect(r.error?.issues.map((i) => i.path[0])).toContain("confidenceAfter");
  });
});

describe("requestSchema", () => {
  it("needs a description of at least 10 characters", () => {
    expect(requestSchema.safeParse({ workshopId, description: "help" }).success).toBe(false);
    expect(requestSchema.parse({ workshopId, description: "Practice exercises please", topicOther: "JOINs" }).topic).toBe("JOINs");
  });
});

describe("resourceSchema", () => {
  it("accepts https links only", () => {
    expect(resourceSchema.safeParse({ workshopId, title: "Guide", url: "https://example.org/guide" }).success).toBe(true);
    for (const url of ["http://example.org", "javascript:alert(1)", "example.org", "ftp://x.org"]) {
      expect(resourceSchema.safeParse({ workshopId, title: "Guide", url }).success).toBe(false);
    }
  });

  it("reads the 'fulfil matching requests' checkbox", () => {
    expect(resourceSchema.parse({ workshopId, title: "Guide", url: "https://a.org", fulfilMatching: "on" }).fulfilMatching).toBe(true);
    expect(resourceSchema.parse({ workshopId, title: "Guide", url: "https://a.org" }).fulfilMatching).toBe(false);
  });
});

describe("fulfilSchema", () => {
  it("accepts an existing resource, a new link, or a note", () => {
    expect(fulfilSchema.safeParse({ requestId, resourceId: workshopId }).success).toBe(true);
    expect(fulfilSchema.safeParse({ requestId, newTitle: "JOINs guide", newUrl: "https://a.org/joins" }).success).toBe(true);
    expect(fulfilSchema.safeParse({ requestId, note: "Covered in next week's session." }).success).toBe(true);
  });

  it("rejects an empty response, so students always get something", () => {
    const r = fulfilSchema.safeParse({ requestId, resourceId: "", newTitle: "", newUrl: "", note: "" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.path[0]).toBe("note");
  });

  it("needs both title and link for a new resource", () => {
    expect(fulfilSchema.safeParse({ requestId, newUrl: "https://a.org" }).error?.issues[0]?.path[0]).toBe("newTitle");
    expect(fulfilSchema.safeParse({ requestId, newTitle: "Guide" }).error?.issues[0]?.path[0]).toBe("newUrl");
  });
});
