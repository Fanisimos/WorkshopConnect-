import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getOrganiserRequests, getWorkshopFeedback, getWorkshopPulse } from "@/features/engagement/queries";
import { summariseFeedback, summarisePulse, topicDemand } from "@/features/insights/compute";
import { CommentsPanel, FeedbackPanel, LearningNeedsPanel, PulsePanel } from "@/features/insights/panels";
import { getOrganiserWorkshop } from "@/features/workshops/queries";
import { OrganiserWorkshopHeader } from "@/features/workshops/workshop-header";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Feedback & insights" };

export default async function WorkshopInsightsPage({ params }: PageProps<"/organiser/workshops/[id]/insights">) {
  const { id } = await params;
  const user = await requireRole("organiser");
  const workshop = await getOrganiserWorkshop(id, user.id);
  if (!workshop) notFound();

  const [feedback, pulse, requests] = await Promise.all([
    getWorkshopFeedback(workshop.id),
    getWorkshopPulse(workshop.id),
    getOrganiserRequests({ workshopId: workshop.id }),
  ]);

  const demand = topicDemand(pulse, requests);
  const openRequests = requests.filter((r) => r.status !== "fulfilled").length;
  const followUpHref = (topic: string) =>
    `/organiser/workshops/${workshop.id}/follow-up?topic=${encodeURIComponent(topic)}#share`;

  return (
    <div className="space-y-6">
      <OrganiserWorkshopHeader workshop={workshop} openRequests={openRequests} />
      <p className="text-sm text-ink-muted">
        {workshop.attendanceCount} checked in · {feedback.length} gave feedback · {pulse.length} completed the Learning Pulse
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <FeedbackPanel summary={summariseFeedback(feedback)} />
        <PulsePanel summary={summarisePulse(pulse)} />
      </div>
      <LearningNeedsPanel demand={demand} followUpHref={followUpHref} />
      <CommentsPanel comments={feedback} />
    </div>
  );
}
