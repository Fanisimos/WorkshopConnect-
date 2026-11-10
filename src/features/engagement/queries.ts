import "server-only";

import type { Enums } from "@/lib/database.types";
import { isUuid } from "@/lib/ids";
import { createClient } from "@/lib/supabase/server";

// Every query runs as the logged-in user; RLS limits students to their own
// rows and organisers to rows for workshops they own.

export type RequestStatus = Enums<"request_status">;

// ---------------------------------------------------------------- student

export async function getMyFeedback(workshopId: string) {
  if (!isUuid(workshopId)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("feedback").select("rating, comment, created_at").eq("workshop_id", workshopId).maybeSingle();
  return data;
}

export async function getMyPulse(workshopId: string) {
  if (!isUuid(workshopId)) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("learning_pulse_responses")
    .select("confidence_before, confidence_after, confidence_change, support_topic, created_at")
    .eq("workshop_id", workshopId)
    .maybeSingle();
  return data;
}

/** Student dashboard: which workshops they've given feedback / pulse for, and their request topics. */
export async function getMyEngagement(studentId: string) {
  const supabase = await createClient();
  const [feedback, pulse, requests] = await Promise.all([
    supabase.from("feedback").select("workshop_id").eq("student_id", studentId),
    supabase.from("learning_pulse_responses").select("workshop_id, support_topic").eq("student_id", studentId),
    supabase.from("resource_requests").select("workshop_id, topic, status").eq("student_id", studentId),
  ]);
  if (feedback.error || pulse.error || requests.error) throw new Error("Could not load your activity");
  return { feedback: feedback.data, pulse: pulse.data, requests: requests.data };
}

const REQUEST_COLUMNS = `id, topic, description, status, organiser_note, created_at, updated_at, fulfilled_at,
  workshop:workshops!resource_requests_workshop_id_fkey(id, title),
  resource:resources!requests_resource_same_workshop(id, title, url)` as const;

export async function getMyRequests(studentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resource_requests")
    .select(REQUEST_COLUMNS)
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });
  if (error) throw new Error("Could not load your requests");
  return data;
}

// ----------------------------------------------------------------- shared

/** Resources shared for a workshop (students: non-draft workshops; organisers: own). */
export async function getWorkshopResources(workshopId: string) {
  if (!isUuid(workshopId)) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resources")
    .select("id, title, url, topic, created_at")
    .eq("workshop_id", workshopId)
    .order("created_at", { ascending: false });
  if (error) throw new Error("Could not load resources");
  return data;
}

/** Resources across the given workshops (e.g. all workshops a student attended). */
export async function getResourcesForWorkshops(workshopIds: string[]) {
  if (!workshopIds.length) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resources")
    .select("id, title, url, topic, workshop_id, workshop:workshops!resources_workshop_id_fkey(title)")
    .in("workshop_id", workshopIds.filter(isUuid))
    .order("created_at", { ascending: false });
  if (error) throw new Error("Could not load resources");
  return data;
}

// -------------------------------------------------------------- organiser

/** Feedback for one of the organiser's workshops. Student identity is deliberately not selected. */
export async function getWorkshopFeedback(workshopId: string) {
  if (!isUuid(workshopId)) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("feedback")
    .select("id, rating, comment, created_at")
    .eq("workshop_id", workshopId)
    .order("created_at", { ascending: false });
  if (error) throw new Error("Could not load feedback");
  return data;
}

/** Learning Pulse responses for one workshop, without student identity. */
export async function getWorkshopPulse(workshopId: string) {
  if (!isUuid(workshopId)) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("learning_pulse_responses")
    .select("confidence_before, confidence_after, confidence_change, support_topic")
    .eq("workshop_id", workshopId);
  if (error) throw new Error("Could not load Learning Pulse responses");
  return data;
}

/** Organiser: requests on their workshops, with student name (needed to follow up). */
export async function getOrganiserRequests(filter: { workshopId?: string; status?: RequestStatus } = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("resource_requests")
    .select(`${REQUEST_COLUMNS}, workshop_id, student:profiles!resource_requests_student_id_fkey(full_name)`)
    .order("created_at", { ascending: false });
  if (filter.workshopId && isUuid(filter.workshopId)) query = query.eq("workshop_id", filter.workshopId);
  if (filter.status) query = query.eq("status", filter.status);
  const { data, error } = await query;
  if (error) throw new Error("Could not load requests");
  return data;
}

/** Organiser dashboard: every feedback rating and pulse row across their workshops (RLS-scoped). */
export async function getOrganiserEngagement() {
  const supabase = await createClient();
  const [feedback, pulse, requests] = await Promise.all([
    supabase.from("feedback").select("workshop_id, rating"),
    supabase.from("learning_pulse_responses").select("workshop_id, confidence_before, confidence_after, confidence_change, support_topic"),
    supabase.from("resource_requests").select("workshop_id, topic, status"),
  ]);
  if (feedback.error || pulse.error || requests.error) throw new Error("Could not load insights");
  return { feedback: feedback.data, pulse: pulse.data, requests: requests.data };
}

/** Organiser: number of not-yet-fulfilled requests for one workshop. */
export async function countOpenRequests(workshopId: string): Promise<number> {
  if (!isUuid(workshopId)) return 0;
  const supabase = await createClient();
  const { count } = await supabase
    .from("resource_requests")
    .select("id", { count: "exact", head: true })
    .eq("workshop_id", workshopId)
    .neq("status", "fulfilled");
  return count ?? 0;
}

export type OrganiserRequest = Awaited<ReturnType<typeof getOrganiserRequests>>[number];
export type MyRequest = Awaited<ReturnType<typeof getMyRequests>>[number];
