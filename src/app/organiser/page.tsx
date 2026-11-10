import type { Metadata } from "next";
import Link from "next/link";

import { ButtonLink } from "@/components/ui/button";
import { Card, EmptyState, PageHeader } from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";
import { getOrganiserEngagement } from "@/features/engagement/queries";
import { formatChange, formatScore, summariseFeedback, summarisePulse, topicDemand } from "@/features/insights/compute";
import { LearningNeedsPanel, PulseDisclaimer } from "@/features/insights/panels";
import { StatusBadge } from "@/features/workshops/components";
import { getOrganiserWorkshops } from "@/features/workshops/queries";
import { requireRole } from "@/lib/auth";
import { formatTimeRange } from "@/lib/dates";

export const metadata: Metadata = { title: "Organiser dashboard" };

export default async function OrganiserDashboardPage() {
  const user = await requireRole("organiser");
  const [workshops, engagement] = await Promise.all([getOrganiserWorkshops(user.id), getOrganiserEngagement()]);
  const now = new Date();
  const firstName = user.fullName.split(" ")[0];

  const upcoming = workshops
    .filter((w) => w.status !== "cancelled" && w.status !== "draft" && new Date(w.ends_at) >= now)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const totalCheckIns = workshops.reduce((sum, w) => sum + w.attendanceCount, 0);
  const feedback = summariseFeedback(engagement.feedback);
  const pulse = summarisePulse(engagement.pulse);
  const outstanding = engagement.requests.filter((r) => r.status !== "fulfilled").length;
  const demand = topicDemand(engagement.pulse, engagement.requests);

  // Per-workshop ratings to spot sessions that need attention.
  const ratingByWorkshop = new Map<string, number[]>();
  engagement.feedback.forEach((f) => ratingByWorkshop.set(f.workshop_id, [...(ratingByWorkshop.get(f.workshop_id) ?? []), f.rating]));
  const rated = workshops
    .filter((w) => ratingByWorkshop.has(w.id))
    .map((w) => {
      const r = ratingByWorkshop.get(w.id)!;
      return { ...w, average: r.reduce((a, b) => a + b, 0) / r.length, ratings: r.length };
    })
    .sort((a, b) => a.average - b.average);

  return (
    <>
      <PageHeader
        title={`Welcome, ${firstName}`}
        description="Attendance, feedback and learning needs across your workshops."
        actions={<ButtonLink href="/organiser/workshops/new">New workshop</ButtonLink>}
      />

      {workshops.length === 0 ? (
        <EmptyState
          title="No workshops yet"
          description="Create your first workshop to get a check-in QR code and start collecting feedback."
          action={<ButtonLink href="/organiser/workshops/new">Create workshop</ButtonLink>}
        />
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Check-ins" value={totalCheckIns} hint={`across ${workshops.length} workshops`} />
            <Stat label="Average rating" value={formatScore(feedback.average)} hint={`${feedback.count} ratings`} />
            <Stat label="Avg. confidence change" value={formatChange(pulse.averageChange)} hint={`${pulse.count} Learning Pulse responses`} />
            <Link href="/organiser/requests" className="rounded-xl focus-visible:outline-2">
              <Stat label="Outstanding requests" value={outstanding} hint="pending or in progress →" />
            </Link>
          </div>
          {pulse.count > 0 && <PulseDisclaimer />}

          <div className="grid gap-6 lg:grid-cols-2">
            <LearningNeedsPanel demand={demand} showWorkshopNote />

            <section aria-labelledby="ratings-heading">
              <Card className="h-full p-5">
                <h2 id="ratings-heading" className="font-semibold text-ink">
                  Ratings by workshop
                </h2>
                <p className="text-sm text-ink-muted">Lowest first, so you can see where to follow up.</p>
                {rated.length === 0 ? (
                  <p className="mt-4 text-sm text-ink-muted">No ratings yet.</p>
                ) : (
                  <ul className="mt-4 divide-y divide-line">
                    {rated.slice(0, 6).map((w) => (
                      <li key={w.id}>
                        <Link href={`/organiser/workshops/${w.id}/insights`} className="flex items-center justify-between gap-3 py-2.5 hover:text-brand-800">
                          <span className="truncate text-sm font-medium text-ink">{w.title}</span>
                          <span className="text-sm whitespace-nowrap text-ink-muted tabular-nums">
                            <span className="font-semibold text-ink">{formatScore(w.average)}</span> / 5 · {w.ratings}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </section>
          </div>

          <section aria-labelledby="next-heading">
            <h2 id="next-heading" className="mb-3 text-sm font-semibold tracking-wide text-ink-muted uppercase">
              Coming up
            </h2>
            {upcoming.length === 0 ? (
              <EmptyState title="Nothing scheduled" description="Published workshops that haven't ended yet appear here." />
            ) : (
              <Card className="divide-y divide-line">
                {upcoming.slice(0, 5).map((w) => (
                  <Link
                    key={w.id}
                    href={`/organiser/workshops/${w.id}`}
                    className="flex flex-col gap-1 p-4 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="font-medium text-ink">{w.title}</span>
                    <span className="flex items-center gap-3 text-sm text-ink-muted">
                      {formatTimeRange(w.starts_at, w.ends_at)}
                      <StatusBadge status={w.status} />
                    </span>
                  </Link>
                ))}
              </Card>
            )}
          </section>
        </div>
      )}
    </>
  );
}
