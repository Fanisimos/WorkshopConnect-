import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { homePathFor, type Role } from "@/lib/paths";
import { createClient } from "@/lib/supabase/server";

export { homePathFor, safeNextPath, type Role } from "@/lib/paths";

export type CurrentUser = {
  id: string;
  email: string | null;
  fullName: string;
  role: Role;
};

/**
 * The logged-in user, or null. Identity comes from the verified JWT
 * (getClaims); the role comes from the profiles table, never from the client
 * or from user-editable metadata. cache() dedupes this within one request.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || !userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", userId)
    .single();
  if (!profile) return null;

  return {
    id: userId,
    email: typeof data.claims.email === "string" ? data.claims.email : null,
    fullName: profile.full_name,
    role: profile.role,
  };
});

/** For pages: redirect to login if logged out. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** For pages and layouts: wrong role is sent to their own home page. */
export async function requireRole(role: Role): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== role) redirect(homePathFor(user.role));
  return user;
}

/**
 * For Server Actions: throws instead of redirecting, so a forged request
 * from the wrong role fails loudly. RLS would also reject it.
 */
export async function assertRole(role: Role): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user || user.role !== role) {
    throw new Error("Not authorised");
  }
  return user;
}
