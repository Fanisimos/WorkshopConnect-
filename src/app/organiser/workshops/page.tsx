import type { Metadata } from "next";
import Link from "next/link";

import { ButtonLink } from "@/components/ui/button";
import { Card, EmptyState, PageHeader } from "@/components/ui/card";
import { StatusBadge, WorkshopMeta } from "@/features/workshops/components";
import { getOrganiserWorkshops } from "@/features/workshops/queries";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Your workshops" };

export default async function OrganiserWorkshopsPage() {
  const user = await requireRole("organiser");
  const workshops = await getOrganiserWorkshops(user.id);

  return (
    <>
      <PageHeader
        title="Your workshops"
        description="Create workshops, open check-in and follow up on what students need."
        actions={<ButtonLink href="/organiser/workshops/new">New workshop</ButtonLink>}
      />

      {workshops.length === 0 ? (
        <EmptyState
          title="No workshops yet"
          description="Create your first workshop. You can save it as a draft and publish it when you're ready."
          action={<ButtonLink href="/organiser/workshops/new">Create workshop</ButtonLink>}
        />
      ) : (
        <ul className="grid gap-3">
          {workshops.map((w) => (
            <li key={w.id}>
              <Card className="relative p-4 transition-shadow hover:shadow-md sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-ink">
                        <Link href={`/organiser/workshops/${w.id}`} className="after:absolute after:inset-0">
                          {w.title}
                        </Link>
                      </h2>
                      <StatusBadge status={w.status} />
                    </div>
                    <WorkshopMeta startsAt={w.starts_at} endsAt={w.ends_at} location={w.location} />
                  </div>
                  <p className="text-sm text-ink-muted sm:text-right">
                    <span className="text-lg font-semibold text-ink">{w.attendanceCount}</span>{" "}
                    {w.attendanceCount === 1 ? "attendee" : "attendees"}
                  </p>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
