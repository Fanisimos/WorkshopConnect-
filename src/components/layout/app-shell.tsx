import type { ReactNode } from "react";

import { Brand } from "@/components/brand";
import { NavLinks, type NavItem } from "@/components/layout/nav-links";
import { signOut } from "@/features/auth/actions";
import type { CurrentUser } from "@/lib/auth";

/** Shared chrome for logged-in pages: brand, main navigation, user + logout. */
export function AppShell({ user, nav, children }: { user: CurrentUser; nav: NavItem[]; children: ReactNode }) {
  const roleLabel = user.role === "organiser" ? "Organiser" : "Student";

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:shadow"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:gap-8">
          <div className="flex items-center justify-between gap-4">
            <Brand href={nav[0]?.href ?? "/"} />
            <UserMenu user={user} roleLabel={roleLabel} className="flex md:hidden" />
          </div>
          <div className="flex-1">
            <NavLinks items={nav} />
          </div>
          <UserMenu user={user} roleLabel={roleLabel} className="hidden md:flex" />
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}

function UserMenu({ user, roleLabel, className }: { user: CurrentUser; roleLabel: string; className?: string }) {
  return (
    <div className={`items-center gap-3 ${className ?? "flex"}`}>
      <div className="hidden text-right leading-tight sm:block">
        <p className="text-sm font-medium text-ink">{user.fullName}</p>
        <p className="text-xs text-ink-muted">{roleLabel}</p>
      </div>
      <form action={signOut}>
        <button
          type="submit"
          className="rounded-lg px-3 py-2 text-sm font-medium text-ink-muted hover:bg-slate-100 hover:text-ink"
        >
          Log out
        </button>
      </form>
    </div>
  );
}
