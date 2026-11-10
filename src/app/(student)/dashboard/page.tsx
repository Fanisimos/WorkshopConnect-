import type { Metadata } from "next";
import Link from "next/link";

import { ButtonLink } from "@/components/ui/button";
import { Card, EmptyState, PageHeader } from "@/components/ui/card";
import { PhaseBadge } from "@/features/workshops/components";
import { workshopPhase } from "@/features/workshops/phase";
import { getVisibleWorkshops } from "@/features/workshops/queries";
import { requireRole } from "@/lib/auth";
import { formatTimeRange } from "@/lib/dates";

export const metadata: Metadata = { title: "Dashboard" };

export default async function StudentDashboardPage() {
  const user = await requireRole("student");
  const workshops = await getVisibleWorkshops();
  const now = new Date();
  const firstName = user.fullName.split(" ")[0];

  const upcoming = workshops
    .map((w) => ({ ...w, phase: workshopPhase(w, now) }))
    .filter((w) => w.phase === "upcoming" || w.phase === "live")
    .slice(0, 4);

  return (
    <>
      <PageHeader title={`Hi, ${firstName}`} description="Your workshops, feedback and support requests in one place." />

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
