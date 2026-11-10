import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState, PageHeader } from "@/components/ui/card";
import { getOrganiserRequests, getResourcesForWorkshops, type RequestStatus } from "@/features/engagement/queries";
import { OrganiserRequestCard } from "@/features/engagement/request-card";
import { requireRole } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Resource requests" };

const FILTERS: { key: "open" | RequestStatus | "all"; label: string }[] = [
  { key: "open", label: "Open" },
  { key: "pending", label: "Pending" },
  { key: "in_progress", label: "In progress" },
  { key: "fulfilled", label: "Fulfilled" },
  { key: "all", label: "All" },
];

/** Every request across the organiser's workshops (RLS limits it to their own). */
export default async function OrganiserRequestsPage({ searchParams }: PageProps<"/organiser/requests">) {
  await requireRole("organiser");
  const query = await searchParams;
  const filter = FILTERS.find((f) => f.key === query.status)?.key ?? "open";

  const all = await getOrganiserRequests();
  const requests =
    filter === "all" ? all : filter === "open" ? all.filter((r) => r.status !== "fulfilled") : all.filter((r) => r.status === filter);

  // resources per workshop, for each card's "share an existing resource" dropdown
  const workshopIds = [...new Set(requests.map((r) => r.workshop_id))];
  const resources = await getResourcesForWorkshops(workshopIds);
  const resourcesFor = (workshopId: string) => resources.filter((r) => r.workshop_id === workshopId);

  const counts = {
    open: all.filter((r) => r.status !== "fulfilled").length,
    pending: all.filter((r) => r.status === "pending").length,
    in_progress: all.filter((r) => r.status === "in_progress").length,
    fulfilled: all.filter((r) => r.status === "fulfilled").length,
    all: all.length,
  };

  return (
    <>
      <PageHeader title="Resource requests" description="What students have asked for across your workshops." />

      <nav aria-label="Filter requests" className="mb-5 flex gap-1 overflow-x-auto">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "open" ? "/organiser/requests" : `/organiser/requests?status=${f.key}`}
            aria-current={filter === f.key ? "page" : undefined}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap",
              filter === f.key ? "bg-brand-50 text-brand-800" : "text-ink-muted hover:bg-slate-100 hover:text-ink",
            )}
          >
            {f.label} <span className="tabular-nums">({counts[f.key]})</span>
          </Link>
        ))}
      </nav>

      {requests.length === 0 ? (
        <EmptyState
          title={filter === "open" ? "No open requests" : "No requests here"}
          description="When students ask for extra resources, their requests appear here so you can respond."
        />
      ) : (
        <ul className="space-y-3">
          {requests.map((r) => (
            <li key={r.id}>
              <OrganiserRequestCard request={r} resources={resourcesFor(r.workshop_id)} showWorkshop />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
