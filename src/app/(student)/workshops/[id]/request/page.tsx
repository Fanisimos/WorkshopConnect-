import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/card";
import { RequestForm } from "@/features/engagement/student-forms";
import { getVisibleWorkshop } from "@/features/workshops/queries";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Request resources" };

export default async function RequestResourcesPage({ params }: PageProps<"/workshops/[id]/request">) {
  const { id } = await params;
  await requireRole("student");
  const workshop = await getVisibleWorkshop(id);
  if (!workshop) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm">
        <Link href={`/workshops/${workshop.id}`} className="text-ink-muted hover:text-ink">
          ← {workshop.title}
        </Link>
      </nav>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Request additional resources</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Tell the organiser of <span className="font-medium text-ink">{workshop.title}</span> what would help. You&apos;ll
          see their response under My requests.
        </p>
      </div>
      <Card className="p-5 sm:p-6">
        <RequestForm workshopId={workshop.id} topics={workshop.focus_topics} />
      </Card>
    </div>
  );
}
