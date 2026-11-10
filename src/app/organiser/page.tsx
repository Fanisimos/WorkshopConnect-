import type { Metadata } from "next";

import { ButtonLink } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Organiser dashboard" };

export default async function OrganiserDashboardPage() {
  const user = await requireRole("organiser");
  const firstName = user.fullName.split(" ")[0];

  return (
    <>
      <PageHeader title={`Welcome, ${firstName}`} description="Attendance, feedback and learning needs across your workshops." />
      <EmptyState
        title="No workshops yet"
        description="Create your first workshop to get a check-in QR code and start collecting feedback."
        action={<ButtonLink href="/organiser/workshops/new">Create workshop</ButtonLink>}
      />
    </>
  );
}
