import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";

import { BarList, ConfidenceComparison } from "./charts";
import { formatChange, formatScore, type FeedbackSummary, type PulseSummary, type TopicDemand } from "./compute";

export function PulseDisclaimer() {
  return (
    <p className="text-xs text-ink-muted">
      Learning Pulse ratings are self-reported. “Before” is rated retrospectively, after the workshop. Confidence change is
      a subjective indicator of how students feel, not a measure of what they learned.
    </p>
  );
}

export function FeedbackPanel({ summary }: { summary: FeedbackSummary }) {
  return (
    <Card className="p-5">
      <h2 className="font-semibold text-ink">Workshop rating</h2>
      {summary.count === 0 ? (
        <p className="mt-3 text-sm text-ink-muted">No feedback yet. Students who checked in can rate the workshop afterwards.</p>
      ) : (
        <div className="mt-4 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
          <div>
            <p className="text-4xl font-semibold text-ink tabular-nums">
              {formatScore(summary.average)}
              <span className="text-lg font-normal text-ink-muted"> / 5</span>
            </p>
            <p className="text-sm text-ink-muted">
              from {summary.count} {summary.count === 1 ? "rating" : "ratings"}
            </p>
          </div>
          <BarList
            caption="Number of ratings at each score"
            bars={[...summary.distribution].reverse().map((d) => ({ label: `${d.rating} ${d.rating === 1 ? "star" : "stars"}`, value: d.count }))}
          />
        </div>
      )}
    </Card>
  );
}

export function PulsePanel({ summary }: { summary: PulseSummary }) {
  return (
    <Card className="space-y-4 p-5">
      <div>
        <h2 className="font-semibold text-ink">Learning Pulse</h2>
        <p className="text-sm text-ink-muted">How confident students say they feel about the topic.</p>
      </div>
      {summary.count === 0 ? (
        <p className="text-sm text-ink-muted">No Learning Pulse responses yet.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Responses" value={summary.count} />
            <Stat label="Avg. before" value={formatScore(summary.averageBefore)} hint="looking back" />
            <Stat label="Avg. now" value={formatScore(summary.averageAfter)} />
            <Stat label="Avg. change" value={formatChange(summary.averageChange)} hint="self-reported" />
          </div>
          <ConfidenceComparison before={summary.averageBefore ?? 0} after={summary.averageAfter ?? 0} />
          <p className="text-sm text-ink-muted">
            {summary.increased} felt more confident, {summary.unchanged} about the same, {summary.decreased} less confident.
          </p>
        </>
      )}
      <PulseDisclaimer />
    </Card>
  );
}

/** Topics students want help with, linked to the follow-up action. */
export function LearningNeedsPanel({
  demand,
  followUpHref,
  showWorkshopNote = false,
}: {
  demand: TopicDemand[];
  /** e.g. (topic) => `/organiser/workshops/${id}/follow-up?topic=...#share` */
  followUpHref?: (topic: string) => string;
  showWorkshopNote?: boolean;
}) {
  return (
    <Card className="p-5">
      <h2 className="font-semibold text-ink">Learning needs</h2>
      <p className="text-sm text-ink-muted">
        Topics students named in the Learning Pulse or in resource requests{showWorkshopNote ? ", across all your workshops" : ""}.
      </p>
      {demand.length === 0 ? (
        <p className="mt-4 text-sm text-ink-muted">No topics mentioned yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Learning needs by topic</caption>
            <thead className="text-xs tracking-wide text-ink-muted uppercase">
              <tr>
                <th scope="col" className="py-2 pr-3 font-medium">Topic</th>
                <th scope="col" className="px-2 py-2 text-right font-medium sm:px-3">Pulse</th>
                <th scope="col" className="px-2 py-2 text-right font-medium sm:px-3">Requests</th>
                <th scope="col" className="px-2 py-2 text-right font-medium sm:px-3">Open</th>
                {followUpHref && <th scope="col" className="py-2 pl-2 sm:pl-3"><span className="sr-only">Action</span></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {demand.slice(0, 10).map((t) => (
                <tr key={t.key}>
                  <th scope="row" className="py-2.5 pr-3 font-medium text-ink">
                    {t.label}
                  </th>
                  <td className="px-2 py-2.5 text-right text-ink-muted tabular-nums sm:px-3">{t.pulseMentions}</td>
                  <td className="px-2 py-2.5 text-right text-ink-muted tabular-nums sm:px-3">{t.requests}</td>
                  <td className="px-2 py-2.5 text-right tabular-nums sm:px-3">
                    <span className={t.openRequests ? "font-semibold text-amber-800" : "text-ink-muted"}>{t.openRequests}</span>
                  </td>
                  {followUpHref && (
                    <td className="py-2.5 pl-2 text-right sm:pl-3">
                      <Link href={followUpHref(t.label)} className="font-medium whitespace-nowrap text-brand-700 hover:underline">
                        Share<span className="sr-only sm:not-sr-only"> resource</span>
                      </Link>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

export function CommentsPanel({ comments }: { comments: { id: string; rating: number; comment: string | null; created_at: string }[] }) {
  const withText = comments.filter((c) => c.comment);
  return (
    <Card className="p-5">
      <h2 className="font-semibold text-ink">Comments</h2>
      <p className="text-sm text-ink-muted">Shown without student names.</p>
      {withText.length === 0 ? (
        <p className="mt-4 text-sm text-ink-muted">No written comments yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {withText.map((c) => (
            <li key={c.id} className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs font-medium text-ink-muted">Rated {c.rating}/5</p>
              <p className="mt-1 text-sm whitespace-pre-line text-ink">{c.comment}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
