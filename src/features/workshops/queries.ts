import "server-only";

import { isUuid } from "@/lib/ids";
import { createClient } from "@/lib/supabase/server";

// All queries run as the logged-in user, so RLS decides what comes back.
// The explicit filters (e.g. organiser_id) are for clarity and index use;
// they are not what keeps data private.

const LIST_COLUMNS = "id, title, location, starts_at, ends_at, status, focus_topics" as const;

/** Organiser: their own workshops (all statuses), newest first, with attendance counts. */
export async function getOrganiserWorkshops(organiserId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workshops")
    .select(`${LIST_COLUMNS}, attendance(count)`)
    .eq("organiser_id", organiserId)
    .order("starts_at", { ascending: false });
  if (error) throw new Error("Could not load workshops");
  return data.map(({ attendance, ...w }) => ({ ...w, attendanceCount: attendance[0]?.count ?? 0 }));
}

/** Organiser: one of their own workshops, or null if it doesn't exist or isn't theirs. */
export async function getOrganiserWorkshop(id: string, organiserId: string) {
  if (!isUuid(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workshops")
    .select("*, attendance(count)")
    .eq("id", id)
    .eq("organiser_id", organiserId)
    .maybeSingle();
  if (error) throw new Error("Could not load workshop");
  if (!data) return null;
  const { attendance, ...workshop } = data;
  return { ...workshop, attendanceCount: attendance[0]?.count ?? 0 };
}

/** Students: every non-draft workshop (RLS hides drafts), soonest first, with organiser name. */
export async function getVisibleWorkshops() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workshops")
    .select(`${LIST_COLUMNS}, organiser:profiles!workshops_organiser_id_fkey(full_name)`)
    .neq("status", "draft")
    .order("starts_at", { ascending: true });
  if (error) throw new Error("Could not load workshops");
  return data;
}

/** Students: one visible workshop with organiser name, or null. */
export async function getVisibleWorkshop(id: string) {
  if (!isUuid(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workshops")
    .select("*, organiser:profiles!workshops_organiser_id_fkey(full_name)")
    .eq("id", id)
    .neq("status", "draft")
    .maybeSingle();
  if (error) throw new Error("Could not load workshop");
  return data;
}

export type OrganiserWorkshopListItem = Awaited<ReturnType<typeof getOrganiserWorkshops>>[number];
export type VisibleWorkshop = Awaited<ReturnType<typeof getVisibleWorkshops>>[number];
