import type { Metadata } from "next";
import Link from "next/link";

import { Card, EmptyState, PageHeader } from "@/components/ui/card";
import { PhaseBadge, TopicChips, WorkshopMeta } from "@/features/workshops/components";
import { workshopPhase } from "@/features/workshops/phase";
import { getVisibleWorkshops, type VisibleWorkshop } from "@/features/workshops/queries";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Workshops" };

export default async function StudentWorkshopsPage() {
  await requireRole("student");
  const workshops = await getVisibleWorkshops();
  const now = new Date();

  const withPhase = workshops.map((w) => ({ ...w, phase: workshopPhase(w, now) }));
  const current = withPhase.filter((w) => w.phase === "live" || w.phase === "upcoming" || (w.phase === "cancelled" && new Date(w.ends_at) >= now));
  const past = withPhase.filter((w) => !current.includes(w)).reverse(); // most recent first

  return (
    <>
      <PageHeader title="Workshops" description="Skills workshops you can attend. Check in by scanning the QR code at the session." />

      <section aria-labelledby="upcoming-heading" className="space-y-3">
        <h2 id="upcoming-heading" className="text-sm font-semibold tracking-wide text-ink-muted uppercase">
          Upcoming
        </h2>
        {current.length === 0 ? (
          <EmptyState title="No upcoming workshops" description="New workshops will appear here when organisers publish them." />
        ) : (
          <WorkshopGrid workshops={current} />
        )}
      </section>

      {past.length > 0 && (
        <section aria-labelledby="past-heading" className="mt-10 space-y-3">
          <h2 id="past-heading" className="text-sm font-semibold tracking-wide text-ink-muted uppercase">
            Past
          </h2>
          <WorkshopGrid workshops={past} />
        </section>
      )}
    </>
  );
}

function WorkshopGrid({ workshops }: { workshops: Array<VisibleWorkshop & { phase: ReturnType<typeof workshopPhase> }> }) {
  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {workshops.map((w) => (
        <li key={w.id}>
          <Card className="relative h-full space-y-3 p-4 transition-shadow hover:shadow-md sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold text-ink">
                <Link href={`/workshops/${w.id}`} className="after:absolute after:inset-0">
                  {w.title}
                </Link>
              </h3>
              <PhaseBadge phase={w.phase} />
            </div>
            <WorkshopMeta startsAt={w.starts_at} endsAt={w.ends_at} location={w.location} host={w.organiser?.full_name} />
            <TopicChips topics={w.focus_topics} />
          </Card>
        </li>
      ))}
    </ul>
  );
}
