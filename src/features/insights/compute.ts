import { topicKey } from "@/lib/topics";

/**
 * Pure aggregation functions for organiser insights. They receive rows that
 * RLS has already limited to the organiser's own workshops.
 *
 * Learning Pulse figures are SELF-REPORTED and RETROSPECTIVE (students rate
 * "before" after the workshop). Confidence change is a subjective indicator,
 * not a measurement of learning.
 */

export type FeedbackRow = { rating: number };
export type PulseRow = { confidence_before: number; confidence_after: number; support_topic?: string | null };
export type RequestRow = { topic: string | null; status: "pending" | "in_progress" | "fulfilled" };

const mean = (xs: number[]): number | null => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export type FeedbackSummary = {
  count: number;
  average: number | null;
  /** counts for ratings 1..5, in that order */
  distribution: { rating: number; count: number }[];
};

export function summariseFeedback(rows: FeedbackRow[]): FeedbackSummary {
  return {
    count: rows.length,
    average: mean(rows.map((r) => r.rating)),
    distribution: [1, 2, 3, 4, 5].map((rating) => ({ rating, count: rows.filter((r) => r.rating === rating).length })),
  };
}

export type PulseSummary = {
  count: number;
  averageBefore: number | null;
  averageAfter: number | null;
  /** mean of (after - before) per student */
  averageChange: number | null;
  increased: number;
  unchanged: number;
  decreased: number;
};

export function summarisePulse(rows: PulseRow[]): PulseSummary {
  const changes = rows.map((r) => r.confidence_after - r.confidence_before);
  return {
    count: rows.length,
    averageBefore: mean(rows.map((r) => r.confidence_before)),
    averageAfter: mean(rows.map((r) => r.confidence_after)),
    averageChange: mean(changes),
    increased: changes.filter((c) => c > 0).length,
    unchanged: changes.filter((c) => c === 0).length,
    decreased: changes.filter((c) => c < 0).length,
  };
}

export type TopicDemand = {
  key: string;
  /** most common spelling students used */
  label: string;
  /** Learning Pulse responses naming this topic */
  pulseMentions: number;
  /** resource requests about this topic (any status) */
  requests: number;
  /** requests not yet fulfilled */
  openRequests: number;
  total: number;
};

/**
 * Learning needs: topics students named in the Learning Pulse or in resource
 * requests, grouped case-insensitively, most-mentioned first.
 */
export function topicDemand(pulse: PulseRow[], requests: RequestRow[]): TopicDemand[] {
  const byKey = new Map<string, TopicDemand & { spellings: Map<string, number> }>();

  const add = (raw: string | null | undefined, kind: "pulse" | "request", open = false) => {
    if (!raw || !raw.trim()) return;
    const key = topicKey(raw);
    const label = raw.replace(/\s+/g, " ").trim();
    const entry =
      byKey.get(key) ??
      { key, label, pulseMentions: 0, requests: 0, openRequests: 0, total: 0, spellings: new Map<string, number>() };
    entry.spellings.set(label, (entry.spellings.get(label) ?? 0) + 1);
    if (kind === "pulse") entry.pulseMentions++;
    else {
      entry.requests++;
      if (open) entry.openRequests++;
    }
    entry.total++;
    byKey.set(key, entry);
  };

  pulse.forEach((p) => add(p.support_topic, "pulse"));
  requests.forEach((r) => add(r.topic, "request", r.status !== "fulfilled"));

  return [...byKey.values()]
    .map(({ spellings, ...entry }) => {
      // first-seen spelling wins ties (Map keeps insertion order)
      let best = entry.label;
      let bestCount = 0;
      for (const [spelling, count] of spellings) {
        if (count > bestCount) {
          best = spelling;
          bestCount = count;
        }
      }
      return { ...entry, label: best };
    })
    .sort((a, b) => b.total - a.total || b.openRequests - a.openRequests || a.label.localeCompare(b.label));
}

/** "3.4", or "–" when there is no data yet. */
export function formatScore(value: number | null, digits = 1): string {
  return value === null ? "–" : value.toFixed(digits);
}

/** "+1.5", "0.0", "-0.5", or "–". */
export function formatChange(value: number | null): string {
  if (value === null) return "–";
  const rounded = Math.round(value * 10) / 10;
  return `${rounded > 0 ? "+" : ""}${rounded.toFixed(1)}`;
}
