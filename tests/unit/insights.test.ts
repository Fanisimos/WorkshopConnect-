import { describe, expect, it } from "vitest";

import { formatChange, formatScore, summariseFeedback, summarisePulse, topicDemand } from "@/features/insights/compute";

describe("summariseFeedback", () => {
  it("computes count, average and a 1-5 distribution", () => {
    const s = summariseFeedback([{ rating: 5 }, { rating: 4 }, { rating: 4 }, { rating: 1 }]);
    expect(s.count).toBe(4);
    expect(s.average).toBe(3.5);
    expect(s.distribution).toEqual([
      { rating: 1, count: 1 },
      { rating: 2, count: 0 },
      { rating: 3, count: 0 },
      { rating: 4, count: 2 },
      { rating: 5, count: 1 },
    ]);
  });

  it("returns null average with no feedback", () => {
    expect(summariseFeedback([]).average).toBeNull();
  });
});

describe("summarisePulse", () => {
  it("averages before, after and per-student change", () => {
    const s = summarisePulse([
      { confidence_before: 2, confidence_after: 4 }, // +2
      { confidence_before: 3, confidence_after: 4 }, // +1
      { confidence_before: 4, confidence_after: 4 }, //  0
      { confidence_before: 5, confidence_after: 4 }, // -1
    ]);
    expect(s.count).toBe(4);
    expect(s.averageBefore).toBe(3.5);
    expect(s.averageAfter).toBe(4);
    expect(s.averageChange).toBe(0.5);
    expect([s.increased, s.unchanged, s.decreased]).toEqual([2, 1, 1]);
  });

  it("average change equals average after minus average before", () => {
    const rows = [
      { confidence_before: 1, confidence_after: 5 },
      { confidence_before: 2, confidence_after: 3 },
      { confidence_before: 3, confidence_after: 5 },
    ];
    const s = summarisePulse(rows);
    expect(s.averageChange).toBeCloseTo(s.averageAfter! - s.averageBefore!);
  });

  it("handles no responses", () => {
    expect(summarisePulse([])).toMatchObject({ count: 0, averageBefore: null, averageAfter: null, averageChange: null });
  });
});

describe("topicDemand", () => {
  it("groups topics case-insensitively across pulse and requests, most mentioned first", () => {
    const demand = topicDemand(
      [
        { confidence_before: 2, confidence_after: 4, support_topic: "SQL JOINs" },
        { confidence_before: 3, confidence_after: 4, support_topic: "sql joins" },
        { confidence_before: 3, confidence_after: 3, support_topic: "GROUP BY" },
        { confidence_before: 3, confidence_after: 3, support_topic: null },
      ],
      [
        { topic: "SQL  JOINs ", status: "pending" },
        { topic: "sql joins", status: "fulfilled" },
        { topic: null, status: "pending" },
      ],
    );
    expect(demand).toHaveLength(2);
    expect(demand[0]).toMatchObject({ key: "sql joins", pulseMentions: 2, requests: 2, openRequests: 1, total: 4 });
    expect(demand[1]).toMatchObject({ key: "group by", label: "GROUP BY", total: 1 });
  });

  it("labels a topic with its most common spelling", () => {
    const demand = topicDemand(
      [
        { confidence_before: 1, confidence_after: 2, support_topic: "sql joins" },
        { confidence_before: 1, confidence_after: 2, support_topic: "SQL JOINs" },
        { confidence_before: 1, confidence_after: 2, support_topic: "SQL JOINs" },
      ],
      [],
    );
    expect(demand[0].label).toBe("SQL JOINs");
  });
});

describe("formatting", () => {
  it("formats scores and signed changes", () => {
    expect(formatScore(3.456)).toBe("3.5");
    expect(formatScore(null)).toBe("–");
    expect(formatChange(1.5)).toBe("+1.5");
    expect(formatChange(0)).toBe("0.0");
    expect(formatChange(-0.46)).toBe("-0.5");
    expect(formatChange(null)).toBe("–");
  });
});
