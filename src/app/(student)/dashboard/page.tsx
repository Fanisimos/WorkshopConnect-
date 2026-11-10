import type { Metadata } from "next";

import { ButtonLink } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Dashboard" };

export default async function StudentDashboardPage() {
  const user = await requireRole("student");
  const firstName = user.fullName.split(" ")[0];

  return (
    <>
      <PageHeader title={`Hi, ${firstName}`} description="Your workshops, feedback and support requests in one place." />
      <EmptyState
        title="You haven't checked in to any workshops yet"
        description="When you attend a workshop, scan the QR code shown by the organiser to check in. Your workshops will appear here."
        action={<ButtonLink href="/workshops">Browse workshops</ButtonLink>}
      />
    </>
  );
}
