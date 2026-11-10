import { AppShell } from "@/components/layout/app-shell";
import { requireRole } from "@/lib/auth";

const nav = [
  { href: "/organiser", label: "Dashboard", exact: true },
  { href: "/organiser/workshops", label: "Workshops" },
  { href: "/organiser/requests", label: "Requests" },
];

/**
 * Every page under /organiser is organiser-only. Students are redirected to
 * their dashboard. This is a UX guard; the database (RLS) enforces the same rule.
 */
export default async function OrganiserLayout({ children }: LayoutProps<"/organiser">) {
  const user = await requireRole("organiser");
  return (
    <AppShell user={user} nav={nav}>
      {children}
    </AppShell>
  );
}
