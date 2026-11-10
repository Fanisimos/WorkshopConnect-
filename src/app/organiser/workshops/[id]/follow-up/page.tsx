import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { Card, EmptyState } from "@/components/ui/card";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { deleteResource } from "@/features/engagement/actions";
import { ResourceLink } from "@/features/engagement/components";
import { ResourceForm } from "@/features/engagement/organiser-forms";
import { getOrganiserRequests, getWorkshopResources } from "@/features/engagement/queries";
import { OrganiserRequestCard } from "@/features/engagement/request-card";
import { getOrganiserWorkshop } from "@/features/workshops/queries";
import { OrganiserWorkshopHeader } from "@/features/workshops/workshop-header";
import { requireRole } from "@/lib/auth";
import { topicKey } from "@/lib/topics";

export const metadata: Metadata = { title: "Follow-up" };

/** Resources shared for this workshop and the students' requests: the "close the loop" page. */
export default async function WorkshopFollowUpPage({ params, searchParams }: PageProps<"/organiser/workshops/[id]/follow-up">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const user = await requireRole("organiser");
  const workshop = await getOrganiserWorkshop(id, user.id);
  if (!workshop) notFound();

  const [resources, requests] = await Promise.all([
    getWorkshopResources(workshop.id),
    getOrganiserRequests({ workshopId: workshop.id }),
  ]);

  const open = requests.filter((r) => r.status !== "fulfilled");
  const done = requests.filter((r) => r.status === "fulfilled");
  const topic = typeof query.topic === "string" ? query.topic.slice(0, 80) : undefined;
  const openMatching = topic ? open.filter((r) => r.topic && topicKey(r.topic) === topicKey(topic)).length : 0;
  const resourceOptions = resources.map((r) => ({ id: r.id, title: r.title }));

  return (
    <div className="space-y-6">
      <OrganiserWorkshopHeader workshop={workshop} openRequests={open.length} />
      {query.fulfilled && (
        <Alert tone="success">
          Request fulfilled. The student can now see your response under My requests.
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <section aria-labelledby="requests-heading" className="space-y-3 lg:col-span-3">
          <h2 id="requests-heading" className="text-sm font-semibold tracking-wide text-ink-muted uppercase">
            Open requests ({open.length})
          </h2>
          {open.length === 0 ? (
            <EmptyState title="No open requests" description="When students ask for extra resources for this workshop, they'll appear here." />
          ) : (
            <ul className="space-y-3">
              {open.map((r) => (
                <li key={r.id}>
                  <OrganiserRequestCard request={r} resources={resourceOptions} />
                </li>
              ))}
            </ul>
          )}

          {done.length > 0 && (
            <details className="pt-2">
              <summary className="cursor-pointer text-sm font-medium text-ink-muted hover:text-ink">
                Fulfilled requests ({done.length})
              </summary>
              <ul className="mt-3 space-y-3">
                {done.map((r) => (
                  <li key={r.id}>
                    <OrganiserRequestCard request={r} resources={resourceOptions} />
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>

        <section aria-labelledby="resources-heading" className="space-y-3 lg:col-span-2">
          <h2 id="resources-heading" className="text-sm font-semibold tracking-wide text-ink-muted uppercase">
            Shared resources
          </h2>
          <Card id="share" className="scroll-mt-24 p-5">
            <h3 className="mb-1 font-semibold text-ink">{topic ? `Share a resource for “${topic}”` : "Share a resource"}</h3>
            <p className="mb-4 text-sm text-ink-muted">Every student can see resources on the workshop page.</p>
            <ResourceForm workshopId={workshop.id} defaultTopic={topic} openMatching={openMatching} topics={workshop.focus_topics} />
          </Card>

          {resources.length > 0 && (
            <ul className="space-y-2">
              {resources.map((r) => (
                <li key={r.id} className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <ResourceLink title={r.title} url={r.url} topic={r.topic} />
                  </div>
                  <form action={deleteResource.bind(null, r.id, workshop.id)}>
                    <ConfirmSubmit
                      confirmMessage={`Remove “${r.title}”? Students will no longer see it.`}
                      variant="secondary"
                      size="sm"
                      className=""
                      pendingText="…"
                    >
                      Remove
                    </ConfirmSubmit>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
