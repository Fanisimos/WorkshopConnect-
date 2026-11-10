import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getMyCheckIn } from "@/features/attendance/queries";
import { ScorePill } from "@/features/engagement/components";
import { getMyFeedback, getMyPulse } from "@/features/engagement/queries";
import { FeedbackForm, PulseForm } from "@/features/engagement/student-forms";
import { formatChange } from "@/features/insights/compute";
import { getVisibleWorkshop } from "@/features/workshops/queries";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Feedback & Learning Pulse" };

export default async function WorkshopFeedbackPage({ params }: PageProps<"/workshops/[id]/feedback">) {
  const { id } = await params;
  await requireRole("student");
  const workshop = await getVisibleWorkshop(id);
  if (!workshop) notFound();

  const [checkedInAt, feedback, pulse] = await Promise.all([
    getMyCheckIn(workshop.id),
    getMyFeedback(workshop.id),
    getMyPulse(workshop.id),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm">
        <Link href={`/workshops/${workshop.id}`} className="text-ink-muted hover:text-ink">
          ← {workshop.title}
        </Link>
      </nav>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">After the workshop</h1>
        <p className="mt-1 text-sm text-ink-muted">Two quick steps that help the organiser follow up on what you need.</p>
      </div>

      {!checkedInAt ? (
        <Alert tone="info" title="Check in first">
          Feedback and the Learning Pulse are for students who checked in to this workshop. Scan the QR code at the session
          to check in.
        </Alert>
      ) : (
        <>
          <Card className="p-5 sm:p-6">
            <StepHeading step={1} title="Rate the workshop" done={Boolean(feedback)} />
            {feedback ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-emerald-700">Thanks for your feedback!</p>
                <ScorePill label="Your rating" value={feedback.rating} />
                {feedback.comment && <p className="text-sm whitespace-pre-line text-ink-muted">“{feedback.comment}”</p>}
              </div>
            ) : (
              <FeedbackForm workshopId={workshop.id} />
            )}
          </Card>

          <Card className="p-5 sm:p-6">
            <StepHeading step={2} title="Learning Pulse" done={Boolean(pulse)} />
            {pulse ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-emerald-700">Learning Pulse saved. Thank you!</p>
                <div className="grid grid-cols-3 gap-2">
                  <ScorePill label="Before (looking back)" value={pulse.confidence_before} />
                  <ScorePill label="Now" value={pulse.confidence_after} />
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <p className="text-xs text-ink-muted">Change</p>
                    <p className="text-lg font-semibold text-ink tabular-nums">{formatChange(pulse.confidence_change)}</p>
                  </div>
                </div>
                {pulse.support_topic && (
                  <p className="text-sm text-ink-muted">
                    You asked for more help with <span className="font-medium text-ink">{pulse.support_topic}</span>.
                  </p>
                )}
                <p className="text-xs text-ink-muted">
                  These are your own ratings of how confident you feel. They aren&apos;t a test score.
                </p>
              </div>
            ) : (
              <>
                <p className="mb-5 text-sm text-ink-muted">
                  Three questions, about 30 seconds. There are no right answers; this is about how confident you feel.
                </p>
                <PulseForm workshopId={workshop.id} topics={workshop.focus_topics} />
              </>
            )}
          </Card>

          {feedback && pulse && (
            <Card className="p-5 sm:p-6">
              <h2 className="font-semibold text-ink">Need extra support?</h2>
              <p className="mt-1 text-sm text-ink-muted">
                Ask the organiser for practice material, slides or other resources. You can track the response under My
                requests.
              </p>
              <ButtonLink href={`/workshops/${workshop.id}/request`} variant="secondary" className="mt-4">
                Request resources
              </ButtonLink>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function StepHeading({ step, title, done }: { step: number; title: string; done: boolean }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span
        className={`grid size-7 place-items-center rounded-full text-sm font-semibold ${done ? "bg-emerald-600 text-white" : "bg-brand-50 text-brand-800"}`}
        aria-hidden="true"
      >
        {done ? "✓" : step}
      </span>
      <h2 className="font-semibold text-ink">
        <span className="sr-only">Step {step}: </span>
        {title}
        {done && <span className="sr-only"> (completed)</span>}
      </h2>
    </div>
  );
}
