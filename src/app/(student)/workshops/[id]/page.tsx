import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getMyCheckIn } from "@/features/attendance/queries";
import { ResourceLink } from "@/features/engagement/components";
import { getMyFeedback, getMyPulse, getWorkshopResources } from "@/features/engagement/queries";
import { PhaseBadge, TopicChips, WorkshopMeta } from "@/features/workshops/components";
import { workshopPhase } from "@/features/workshops/phase";
import { getVisibleWorkshop } from "@/features/workshops/queries";
import { requireRole } from "@/lib/auth";
import { formatDateTime } from "@/lib/dates";

export const metadata: Metadata = { title: "Workshop" };

export default async function StudentWorkshopPage({ params }: PageProps<"/workshops/[id]">) {
  const { id } = await params;
  await requireRole("student");
  const workshop = await getVisibleWorkshop(id);
  if (!workshop) notFound();

  const phase = workshopPhase(workshop);
  const [checkedInAt, feedback, pulse, resources] = await Promise.all([
    getMyCheckIn(workshop.id),
    getMyFeedback(workshop.id),
    getMyPulse(workshop.id),
    getWorkshopResources(workshop.id),
  ]);
  const followUpDone = Boolean(feedback && pulse);

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
      {checkedInAt && (
        <Card className="flex flex-col gap-4 border-emerald-200 bg-emerald-50/50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-emerald-900">You attended this workshop</p>
            <p className="text-sm text-emerald-800">
              Checked in on {formatDateTime(checkedInAt)}.{" "}
              {followUpDone
                ? "Thanks for your feedback and Learning Pulse."
                : "Tell us how it went and what you'd like more help with."}
            </p>
          </div>
          <ButtonLink href={`/workshops/${workshop.id}/feedback`} variant={followUpDone ? "secondary" : "primary"}>
            {followUpDone ? "View your responses" : "Give feedback"}
          </ButtonLink>
        </Card>
      )}
      {!checkedInAt && (phase === "upcoming" || phase === "live") && (
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

      <Card className="p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-ink">Learning resources</h2>
            <p className="mt-1 text-sm text-ink-muted">Material shared by the organiser for this workshop.</p>
          </div>
          {phase !== "cancelled" && (
            <ButtonLink href={`/workshops/${workshop.id}/request`} variant="secondary" size="sm">
              Request resources
            </ButtonLink>
          )}
        </div>
        {resources.length === 0 ? (
          <p className="mt-4 text-sm text-ink-muted">No resources shared yet.</p>
        ) : (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {resources.map((r) => (
              <li key={r.id}>
                <ResourceLink title={r.title} url={r.url} topic={r.topic} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
