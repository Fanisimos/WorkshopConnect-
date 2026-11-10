import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { SubmitButton } from "@/components/ui/submit-button";
import { deleteDraftWorkshop, setWorkshopStatus } from "@/features/workshops/actions";
import { StatusBadge, TopicChips, WorkshopMeta } from "@/features/workshops/components";
import { getOrganiserWorkshop } from "@/features/workshops/queries";
import { allowedTransitions, type WorkshopStatus } from "@/features/workshops/schema";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Workshop" };

const STATUS_HELP: Record<WorkshopStatus, string> = {
  draft: "Only you can see this workshop. Publish it to make it visible to students.",
  published:
    "Students can see this workshop. Check-in opens 30 minutes before the start and closes 60 minutes after the end.",
  completed: "This workshop has finished. Students can still give feedback and request resources.",
  cancelled: "Students see this workshop as cancelled. Check-in is closed.",
};

const ACTION_LABEL: Record<WorkshopStatus, { from: Partial<Record<WorkshopStatus, string>> }> = {
  published: { from: { draft: "Publish workshop", completed: "Reopen workshop", cancelled: "Reinstate workshop" } },
  completed: { from: { published: "Mark as completed" } },
  cancelled: { from: { published: "Cancel workshop" } },
  draft: { from: {} },
};

export default async function OrganiserWorkshopPage({ params, searchParams }: PageProps<"/organiser/workshops/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const user = await requireRole("organiser");
  const workshop = await getOrganiserWorkshop(id, user.id);
  if (!workshop) notFound();

  const transitions = allowedTransitions(workshop.status);

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm">
        <Link href="/organiser/workshops" className="text-ink-muted hover:text-ink">
          ← All workshops
        </Link>
      </nav>

      {query.created && (
        <Alert tone="success">
          Workshop {workshop.status === "published" ? "published" : "saved as a draft"}.
        </Alert>
      )}
      {query.saved && <Alert tone="success">Changes saved.</Alert>}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">{workshop.title}</h1>
            <StatusBadge status={workshop.status} />
          </div>
          <WorkshopMeta startsAt={workshop.starts_at} endsAt={workshop.ends_at} location={workshop.location} />
        </div>
        <ButtonLink href={`/organiser/workshops/${workshop.id}/edit`} variant="secondary">
          Edit details
        </ButtonLink>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-ink">About this workshop</h2>
            <p className="mt-2 text-sm whitespace-pre-line text-ink-muted">
              {workshop.description || "No description yet."}
            </p>
            {workshop.focus_topics.length > 0 && (
              <div className="mt-4">
                <h3 className="mb-2 text-xs font-medium tracking-wide text-ink-muted uppercase">Focus topics</h3>
                <TopicChips topics={workshop.focus_topics} />
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-ink">Attendance</h2>
            <p className="mt-2 text-3xl font-semibold text-ink">{workshop.attendanceCount}</p>
            <p className="text-sm text-ink-muted">
              {workshop.attendanceCount === 1 ? "student checked in" : "students checked in"}
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-ink">Status</h2>
            <div className="mt-2">
              <StatusBadge status={workshop.status} />
            </div>
            <p className="mt-2 text-sm text-ink-muted">{STATUS_HELP[workshop.status]}</p>

            <div className="mt-4 flex flex-col gap-2">
              {transitions.map((next) => {
                const label = ACTION_LABEL[next].from[workshop.status] ?? next;
                const action = setWorkshopStatus.bind(null, workshop.id, next);
                return (
                  <form key={next} action={action}>
                    {next === "cancelled" ? (
                      <ConfirmSubmit
                        confirmMessage="Cancel this workshop? Students will see it as cancelled and check-in will close."
                        pendingText="Cancelling…"
                      >
                        {label}
                      </ConfirmSubmit>
                    ) : (
                      <SubmitButton variant={next === "published" ? "primary" : "secondary"} className="w-full" pendingText="Updating…">
                        {label}
                      </SubmitButton>
                    )}
                  </form>
                );
              })}

              {workshop.status === "draft" && (
                <form action={deleteDraftWorkshop.bind(null, workshop.id)}>
                  <ConfirmSubmit
                    confirmMessage="Delete this draft permanently? This cannot be undone."
                    variant="secondary"
                    pendingText="Deleting…"
                  >
                    Delete draft
                  </ConfirmSubmit>
                </form>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
