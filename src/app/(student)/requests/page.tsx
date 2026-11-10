import type { Metadata } from "next";
import Link from "next/link";

import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { Card, EmptyState, PageHeader } from "@/components/ui/card";
import { RequestStatusBadge, ResourceLink } from "@/features/engagement/components";
import { getMyRequests } from "@/features/engagement/queries";
import { requireRole } from "@/lib/auth";
import { formatDateTime } from "@/lib/dates";

export const metadata: Metadata = { title: "My requests" };

export default async function MyRequestsPage({ searchParams }: PageProps<"/requests">) {
  const [user, query] = await Promise.all([requireRole("student"), searchParams]);
  const requests = await getMyRequests(user.id);

  return (
    <>
      <PageHeader
        title="My requests"
        description="Extra learning resources you've asked for, and what organisers have shared in response."
      />
      {query.sent && (
        <Alert tone="success" className="mb-6">
          Request sent. The organiser will see it on their dashboard.
        </Alert>
      )}

      {requests.length === 0 ? (
        <EmptyState
          title="No requests yet"
          description="Open a workshop and choose “Request resources” to ask the organiser for practice material, slides or other help."
          action={<ButtonLink href="/workshops" variant="secondary">Browse workshops</ButtonLink>}
        />
      ) : (
        <ul className="space-y-3">
          {requests.map((r) => (
            <li key={r.id}>
              <Card className="space-y-3 p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-ink-muted">
                      {r.workshop ? (
                        <Link href={`/workshops/${r.workshop.id}`} className="hover:underline">
                          {r.workshop.title}
                        </Link>
                      ) : (
                        "Workshop"
                      )}{" "}
                      · {formatDateTime(r.created_at)}
                    </p>
                    <h2 className="mt-0.5 font-semibold text-ink">{r.topic ?? "General request"}</h2>
                  </div>
                  <RequestStatusBadge status={r.status} />
                </div>
                <p className="text-sm whitespace-pre-line text-ink-muted">{r.description}</p>

                {r.status === "fulfilled" ? (
                  <div className="space-y-2 rounded-lg bg-emerald-50/60 p-3">
                    <p className="text-xs font-medium text-emerald-800">
                      Organiser response{r.fulfilled_at ? ` · ${formatDateTime(r.fulfilled_at)}` : ""}
                    </p>
                    {r.organiser_note && <p className="text-sm whitespace-pre-line text-ink">{r.organiser_note}</p>}
                    {r.resource && <ResourceLink title={r.resource.title} url={r.resource.url} />}
                  </div>
                ) : (
                  <p className="text-xs text-ink-muted">
                    {r.status === "in_progress"
                      ? "The organiser is working on this."
                      : "Waiting for the organiser to review your request."}
                  </p>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
