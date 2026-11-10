import { AppShell } from "@/components/layout/app-shell";
import { requireRole } from "@/lib/auth";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/workshops", label: "Workshops" },
  { href: "/requests", label: "My requests" },
];

/** Every page in this group is student-only. Organisers are redirected to /organiser. */
export default async function StudentLayout({ children }: LayoutProps<"/">) {
  const user = await requireRole("student");
  return (
    <AppShell user={user} nav={nav}>
      {children}
    </AppShell>
  );
}
