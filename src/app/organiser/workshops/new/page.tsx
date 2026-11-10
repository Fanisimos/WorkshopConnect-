import type { Metadata } from "next";

import { Card, PageHeader } from "@/components/ui/card";
import { createWorkshop } from "@/features/workshops/actions";
import { WorkshopForm } from "@/features/workshops/workshop-form";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "New workshop" };

export default async function NewWorkshopPage() {
  await requireRole("organiser");

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="New workshop" description="Students can see a workshop once it's published." />
      <Card className="p-5 sm:p-6">
        <WorkshopForm action={createWorkshop} mode="create" cancelHref="/organiser/workshops" />
      </Card>
    </div>
  );
}
