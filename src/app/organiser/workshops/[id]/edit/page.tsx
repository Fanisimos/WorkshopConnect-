import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Card, PageHeader } from "@/components/ui/card";
import { updateWorkshop } from "@/features/workshops/actions";
import { getOrganiserWorkshop } from "@/features/workshops/queries";
import { WorkshopForm } from "@/features/workshops/workshop-form";
import { requireRole } from "@/lib/auth";
import { utcIsoToUkLocal } from "@/lib/dates";

export const metadata: Metadata = { title: "Edit workshop" };

export default async function EditWorkshopPage({ params }: PageProps<"/organiser/workshops/[id]/edit">) {
  const { id } = await params;
  const user = await requireRole("organiser");
  const workshop = await getOrganiserWorkshop(id, user.id);
  if (!workshop) notFound();

  const start = utcIsoToUkLocal(workshop.starts_at);
  const end = utcIsoToUkLocal(workshop.ends_at);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Edit workshop" description={workshop.title} />
      <Card className="p-5 sm:p-6">
        <WorkshopForm
          action={updateWorkshop.bind(null, workshop.id)}
          mode="edit"
          cancelHref={`/organiser/workshops/${workshop.id}`}
          defaults={{
            title: workshop.title,
            description: workshop.description,
            date: start.date,
            startTime: start.time,
            endTime: end.time,
            location: workshop.location,
            focusTopics: workshop.focus_topics.join(", "),
          }}
        />
      </Card>
    </div>
  );
}
