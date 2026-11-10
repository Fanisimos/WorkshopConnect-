import type { WorkshopStatus } from "./schema";

/** What a student sees: is this workshop upcoming, happening now, over, or cancelled? */
export type WorkshopPhase = "upcoming" | "live" | "ended" | "cancelled";

export function workshopPhase(
  workshop: { status: WorkshopStatus; starts_at: string; ends_at: string },
  now: Date = new Date(),
): WorkshopPhase {
  if (workshop.status === "cancelled") return "cancelled";
  if (workshop.status === "completed") return "ended";
  const t = now.getTime();
  if (t < new Date(workshop.starts_at).getTime()) return "upcoming";
  if (t <= new Date(workshop.ends_at).getTime()) return "live";
  return "ended";
}
