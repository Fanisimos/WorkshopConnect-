import Link from "next/link";
import type { ReactNode } from "react";

import { NavLinks } from "@/components/layout/nav-links";

import { StatusBadge, WorkshopMeta } from "./components";
import type { WorkshopStatus } from "./schema";

/**
 * Shared header for an organiser's workshop pages, with the three-step tabs
 * that mirror the product loop: Overview (attendance) → Insights → Follow-up.
 */
export function OrganiserWorkshopHeader({
  workshop,
  actions,
  openRequests,
}: {
  workshop: { id: string; title: string; status: WorkshopStatus; starts_at: string; ends_at: string; location: string };
  actions?: ReactNode;
  openRequests?: number;
}) {
  const base = `/organiser/workshops/${workshop.id}`;
  return (
    <div className="space-y-4">
      <nav aria-label="Breadcrumb" className="text-sm">
        <Link href="/organiser/workshops" className="text-ink-muted hover:text-ink">
          ← All workshops
        </Link>
      </nav>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">{workshop.title}</h1>
            <StatusBadge status={workshop.status} />
          </div>
          <WorkshopMeta startsAt={workshop.starts_at} endsAt={workshop.ends_at} location={workshop.location} />
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      <div className="border-b border-line pb-2">
        <NavLinks
          label="Workshop sections"
          items={[
            { href: base, label: "Overview & attendance", exact: true },
            { href: `${base}/insights`, label: "Feedback & insights" },
            { href: `${base}/follow-up`, label: openRequests ? `Follow-up (${openRequests})` : "Follow-up" },
          ]}
        />
      </div>
    </div>
  );
}
