import type { Metadata } from "next";
import Link from "next/link";

import { ButtonLink } from "@/components/ui/button";
import { Card, EmptyState, PageHeader } from "@/components/ui/card";
import { getMyAttendance } from "@/features/attendance/queries";
import { PhaseBadge } from "@/features/workshops/components";
import { workshopPhase } from "@/features/workshops/phase";
import { getVisibleWorkshops } from "@/features/workshops/queries";
import { requireRole } from "@/lib/auth";
import { formatDateTime, formatTimeRange } from "@/lib/dates";

export const metadata: Metadata = { title: "Dashboard" };

export default async function StudentDashboardPage() {
  const user = await requireRole("student");
  const [workshops, attended] = await Promise.all([getVisibleWorkshops(), getMyAttendance()]);
  const attendedIds = new Set(attended.map((a) => a.workshop!.id));
  const now = new Date();
  const firstName = user.fullName.split(" ")[0];

  const upcoming = workshops
    .map((w) => ({ ...w, phase: workshopPhase(w, now) }))
    .filter((w) => (w.phase === "upcoming" || w.phase === "live") && !attendedIds.has(w.id))
    .slice(0, 4);

  return (
    <>
      <PageHeader title={`Hi, ${firstName}`} description="Your workshops, feedback and support requests in one place." />

      <section aria-labelledby="attended-heading" className="mb-10">
        <h2 id="attended-heading" className="mb-3 text-sm font-semibold tracking-wide text-ink-muted uppercase">
          Workshops you attended
        </h2>
        {attended.length === 0 ? (
          <EmptyState
            title="No check-ins yet"
            description="At a workshop, scan the QR code shown by the organiser with your phone camera to check in."
          />
        ) : (
          <Card className="divide-y divide-line">
            {attended.map(({ workshop, checked_in_at }) => (
              <Link
                key={workshop!.id}
                href={`/workshops/${workshop!.id}`}
                className="flex flex-col gap-1 p-4 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="font-medium text-ink">{workshop!.title}</span>
                <span className="text-sm text-ink-muted">Checked in {formatDateTime(checked_in_at)}</span>
              </Link>
            ))}
          </Card>
        )}
      </section>

      <section aria-labelledby="upcoming-heading">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="upcoming-heading" className="text-sm font-semibold tracking-wide text-ink-muted uppercase">
            Upcoming workshops
          </h2>
          <Link href="/workshops" className="text-sm font-medium text-brand-700 hover:underline">
            View all
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <EmptyState
            title="No upcoming workshops"
            description="When organisers publish new workshops, they'll appear here."
            action={<ButtonLink href="/workshops" variant="secondary">Browse workshops</ButtonLink>}
          />
        ) : (
          <Card className="divide-y divide-line">
            {upcoming.map((w) => (
              <Link
                key={w.id}
                href={`/workshops/${w.id}`}
                className="flex flex-col gap-1 p-4 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="font-medium text-ink">{w.title}</span>
                <span className="flex items-center gap-3 text-sm text-ink-muted">
                  {formatTimeRange(w.starts_at, w.ends_at)}
                  <PhaseBadge phase={w.phase} />
                </span>
              </Link>
            ))}
          </Card>
        )}
      </section>
    </>
  );
}
