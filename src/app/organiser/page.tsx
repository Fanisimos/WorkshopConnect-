import type { Metadata } from "next";
import Link from "next/link";

import { ButtonLink } from "@/components/ui/button";
import { Card, EmptyState, PageHeader } from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";
import { StatusBadge } from "@/features/workshops/components";
import { getOrganiserWorkshops } from "@/features/workshops/queries";
import { requireRole } from "@/lib/auth";
import { formatTimeRange } from "@/lib/dates";

export const metadata: Metadata = { title: "Organiser dashboard" };

export default async function OrganiserDashboardPage() {
  const user = await requireRole("organiser");
  const workshops = await getOrganiserWorkshops(user.id);
  const now = new Date();
  const firstName = user.fullName.split(" ")[0];

  const upcoming = workshops
    .filter((w) => w.status !== "cancelled" && new Date(w.ends_at) >= now)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const totalCheckIns = workshops.reduce((sum, w) => sum + w.attendanceCount, 0);
  const published = workshops.filter((w) => w.status === "published").length;

  return (
    <>
      <PageHeader
        title={`Welcome, ${firstName}`}
        description="Attendance, feedback and learning needs across your workshops."
        actions={<ButtonLink href="/organiser/workshops/new">New workshop</ButtonLink>}
      />

      {workshops.length === 0 ? (
        <EmptyState
          title="No workshops yet"
          description="Create your first workshop to get a check-in QR code and start collecting feedback."
          action={<ButtonLink href="/organiser/workshops/new">Create workshop</ButtonLink>}
        />
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <Stat label="Workshops" value={workshops.length} hint={`${published} published`} />
            <Stat label="Upcoming" value={upcoming.length} />
            <Stat label="Total check-ins" value={totalCheckIns} />
          </div>

          <section aria-labelledby="next-heading">
            <h2 id="next-heading" className="mb-3 text-sm font-semibold tracking-wide text-ink-muted uppercase">
              Coming up
            </h2>
            {upcoming.length === 0 ? (
              <EmptyState title="Nothing scheduled" description="Workshops you schedule will appear here." />
            ) : (
              <Card className="divide-y divide-line">
                {upcoming.slice(0, 5).map((w) => (
                  <Link
                    key={w.id}
                    href={`/organiser/workshops/${w.id}`}
                    className="flex flex-col gap-1 p-4 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="font-medium text-ink">{w.title}</span>
                    <span className="flex items-center gap-3 text-sm text-ink-muted">
                      {formatTimeRange(w.starts_at, w.ends_at)}
                      <StatusBadge status={w.status} />
                    </span>
                  </Link>
                ))}
              </Card>
            )}
          </section>
        </div>
      )}
    </>
  );
}
