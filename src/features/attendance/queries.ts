import "server-only";

import { isUuid } from "@/lib/ids";
import { createClient } from "@/lib/supabase/server";

import { parseCheckInResult, type CheckInResult } from "./check-in-result";

/**
 * Check the logged-in student in. All rules (token, status, time window,
 * duplicates, identity) are enforced inside the database function.
 */
export async function checkIn(token: string): Promise<CheckInResult> {
  if (!isUuid(token)) return { status: "invalid" };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("check_in", { p_token: token });
  if (error) throw new Error("Check-in failed");
  return parseCheckInResult(data);
}

/** Organiser: the check-in token for one of their workshops (RLS: owner only). */
export async function getWorkshopToken(workshopId: string): Promise<string | null> {
  if (!isUuid(workshopId)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workshop_qr_tokens")
    .select("token")
    .eq("workshop_id", workshopId)
    .maybeSingle();
  if (error) throw new Error("Could not load QR code");
  return data?.token ?? null;
}

/** Organiser: who checked in to their workshop, earliest first (RLS: owner only). */
export async function getWorkshopAttendance(workshopId: string) {
  if (!isUuid(workshopId)) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attendance")
    .select("id, checked_in_at, student:profiles!attendance_student_id_fkey(full_name)")
    .eq("workshop_id", workshopId)
    .order("checked_in_at", { ascending: true });
  if (error) throw new Error("Could not load attendance");
  return data;
}

/** Student: their own check-ins with workshop details, most recent first (RLS: own rows only). */
export async function getMyAttendance() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attendance")
    .select("checked_in_at, workshop:workshops!attendance_workshop_id_fkey(id, title, starts_at, ends_at, location, status)")
    .order("checked_in_at", { ascending: false });
  if (error) throw new Error("Could not load your attendance");
  return data.filter((row) => row.workshop !== null);
}

/** Student: when they checked in to one workshop, or null. */
export async function getMyCheckIn(workshopId: string): Promise<string | null> {
  if (!isUuid(workshopId)) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("attendance")
    .select("checked_in_at")
    .eq("workshop_id", workshopId)
    .maybeSingle();
  return data?.checked_in_at ?? null;
}
