import type { Metadata } from "next";
import Link from "next/link";

import { ButtonLink } from "@/components/ui/button";
import { Card, EmptyState, PageHeader } from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";
import { getMyAttendance } from "@/features/attendance/queries";
import { ResourceLink } from "@/features/engagement/components";
import { getMyEngagement, getResourcesForWorkshops } from "@/features/engagement/queries";
import { PhaseBadge } from "@/features/workshops/components";
import { workshopPhase } from "@/features/workshops/phase";
import { getVisibleWorkshops } from "@/features/workshops/queries";
import { requireRole } from "@/lib/auth";
import { formatDateTime, formatTimeRange } from "@/lib/dates";
import { topicKey } from "@/lib/topics";

export const metadata: Metadata = { title: "Dashboard" };

export default async function StudentDashboardPage() {
  const user = await requireRole("student");
  const [workshops, attended, mine] = await Promise.all([
    getVisibleWorkshops(),
    getMyAttendance(),
    getMyEngagement(user.id),
  ]);
  const now = new Date();
  const firstName = user.fullName.split(" ")[0];

  const attendedWorkshops = attended.map((a) => ({ ...a.workshop!, checkedInAt: a.checked_in_at }));
  const attendedIds = attendedWorkshops.map((w) => w.id);
  const gaveFeedback = new Set(mine.feedback.map((f) => f.workshop_id));
  const didPulse = new Set(mine.pulse.map((p) => p.workshop_id));
  const toDo = attendedWorkshops.filter((w) => !gaveFeedback.has(w.id) || !didPulse.has(w.id));
  const openRequests = mine.requests.filter((r) => r.status !== "fulfilled").length;

  // "Resources for topics you asked about": a simple database match between the
  // topics a student named (Learning Pulse or requests) and resources organisers
  // tagged with the same topic, in workshops the student is linked to.
  const myTopics = new Map<string, Set<string>>(); // workshopId -> topic keys
  const addTopic = (workshopId: string, topic: string | null) => {
    if (!topic) return;
    myTopics.set(workshopId, (myTopics.get(workshopId) ?? new Set()).add(topicKey(topic)));
  };
  mine.pulse.forEach((p) => addTopic(p.workshop_id, p.support_topic));
  mine.requests.forEach((r) => addTopic(r.workshop_id, r.topic));
  const resources = await getResourcesForWorkshops([...new Set([...attendedIds, ...myTopics.keys()])]);
  const forMyTopics = resources.filter((r) => r.topic && myTopics.get(r.workshop_id)?.has(topicKey(r.topic)));

  const upcoming = workshops
    .map((w) => ({ ...w, phase: workshopPhase(w, now) }))
    .filter((w) => (w.phase === "upcoming" || w.phase === "live") && !attendedIds.includes(w.id))
    .slice(0, 4);

  return (
    <>
      <PageHeader title={`Hi, ${firstName}`} description="Your workshops, feedback and support requests in one place." />

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Attended" value={attendedWorkshops.length} />
        <Stat label="Feedback to give" value={toDo.length} />
        <Link href="/requests" className="rounded-xl">
          <Stat label="Open requests" value={openRequests} hint="view →" />
        </Link>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="todo-heading">
          <h2 id="todo-heading" className="mb-3 text-sm font-semibold tracking-wide text-ink-muted uppercase">
            After your workshops
          </h2>
          {attendedWorkshops.length === 0 ? (
            <EmptyState
              title="No check-ins yet"
              description="At a workshop, scan the QR code shown by the organiser with your phone camera to check in."
            />
          ) : toDo.length === 0 ? (
            <EmptyState title="All done" description="You've given feedback and completed the Learning Pulse for every workshop you attended." />
          ) : (
            <Card className="divide-y divide-line">
              {toDo.map((w) => (
                <Link
                  key={w.id}
                  href={`/workshops/${w.id}/feedback`}
                  className="flex items-center justify-between gap-3 p-4 hover:bg-slate-50"
                >
                  <span>
                    <span className="block font-medium text-ink">{w.title}</span>
                    <span className="text-xs text-ink-muted">Checked in {formatDateTime(w.checkedInAt)}</span>
                  </span>
                  <span className="text-sm font-medium whitespace-nowrap text-brand-700">
                    {gaveFeedback.has(w.id) ? "Learning Pulse →" : "Give feedback →"}
                  </span>
                </Link>
              ))}
            </Card>
          )}
        </section>

        <section aria-labelledby="topic-resources-heading">
          <h2 id="topic-resources-heading" className="mb-3 text-sm font-semibold tracking-wide text-ink-muted uppercase">
            Resources for topics you asked about
          </h2>
          {forMyTopics.length === 0 ? (
            <EmptyState
              title="Nothing yet"
              description="When you name a topic in the Learning Pulse or a request, resources organisers share for that topic appear here."
            />
          ) : (
            <ul className="space-y-2">
              {forMyTopics.slice(0, 6).map((r) => (
                <li key={r.id}>
                  <ResourceLink title={r.title} url={r.url} topic={r.topic} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section aria-labelledby="upcoming-heading" className="mt-10">
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
