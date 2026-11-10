import Link from "next/link";

import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatDateTime } from "@/lib/dates";

import { markRequestInProgress } from "./actions";
import { RequestStatusBadge, ResourceLink } from "./components";
import { FulfilForm } from "./organiser-forms";
import type { OrganiserRequest } from "./queries";

/** One student request as the organiser sees it, with the next action. */
export function OrganiserRequestCard({
  request,
  resources,
  showWorkshop = false,
}: {
  request: OrganiserRequest;
  /** resources of the request's workshop, for the fulfil dropdown */
  resources: { id: string; title: string }[];
  showWorkshop?: boolean;
}) {
  return (
    <Card className="space-y-3 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs text-ink-muted">
            {request.student?.full_name ?? "Student"} · {formatDateTime(request.created_at)}
            {showWorkshop && request.workshop && (
              <>
                {" · "}
                <Link href={`/organiser/workshops/${request.workshop.id}/follow-up`} className="hover:underline">
                  {request.workshop.title}
                </Link>
              </>
            )}
          </p>
          <h3 className="mt-0.5 font-semibold text-ink">{request.topic ?? "General request"}</h3>
        </div>
        <RequestStatusBadge status={request.status} />
      </div>
      <p className="text-sm whitespace-pre-line text-ink-muted">{request.description}</p>

      {request.status === "fulfilled" ? (
        <div className="space-y-2 rounded-lg bg-emerald-50/60 p-3">
          <p className="text-xs font-medium text-emerald-800">
            Fulfilled{request.fulfilled_at ? ` · ${formatDateTime(request.fulfilled_at)}` : ""}
          </p>
          {request.organiser_note && <p className="text-sm whitespace-pre-line text-ink">{request.organiser_note}</p>}
          {request.resource && <ResourceLink title={request.resource.title} url={request.resource.url} />}
        </div>
      ) : (
        <details className="group rounded-lg border border-line">
          <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-sm font-medium text-brand-700 hover:bg-slate-50">
            Respond to this request
            <span className="text-ink-muted transition-transform group-open:rotate-180" aria-hidden="true">
              ▾
            </span>
          </summary>
          <div className="space-y-4 border-t border-line p-3">
            {request.status === "pending" && (
              <form action={markRequestInProgress.bind(null, request.id)}>
                <SubmitButton variant="secondary" size="sm" pendingText="Updating…">
                  Mark as in progress
                </SubmitButton>
              </form>
            )}
            <FulfilForm requestId={request.id} resources={resources} />
          </div>
        </details>
      )}
    </Card>
  );
}
