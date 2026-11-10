import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { PhaseBadge, TopicChips, WorkshopMeta } from "@/features/workshops/components";
import { workshopPhase } from "@/features/workshops/phase";
import { getVisibleWorkshop } from "@/features/workshops/queries";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Workshop" };

export default async function StudentWorkshopPage({ params }: PageProps<"/workshops/[id]">) {
  const { id } = await params;
  await requireRole("student");
  const workshop = await getVisibleWorkshop(id);
  if (!workshop) notFound();

  const phase = workshopPhase(workshop);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm">
        <Link href="/workshops" className="text-ink-muted hover:text-ink">
          ← All workshops
        </Link>
      </nav>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{workshop.title}</h1>
          <PhaseBadge phase={phase} />
        </div>
        <WorkshopMeta
          startsAt={workshop.starts_at}
          endsAt={workshop.ends_at}
          location={workshop.location}
          host={workshop.organiser?.full_name}
        />
      </div>

      {phase === "cancelled" && <Alert tone="warning">This workshop has been cancelled.</Alert>}
      {(phase === "upcoming" || phase === "live") && (
        <Alert tone="info" title="How to check in">
          At the workshop, scan the QR code shown by the organiser with your phone camera. You&apos;ll be asked to log in
          if you aren&apos;t already.
        </Alert>
      )}

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-ink">About this workshop</h2>
        <p className="mt-2 text-sm whitespace-pre-line text-ink-muted">{workshop.description || "No description provided."}</p>
        {workshop.focus_topics.length > 0 && (
          <div className="mt-4">
            <h3 className="mb-2 text-xs font-medium tracking-wide text-ink-muted uppercase">Topics covered</h3>
            <TopicChips topics={workshop.focus_topics} />
          </div>
        )}
      </Card>
    </div>
  );
}
