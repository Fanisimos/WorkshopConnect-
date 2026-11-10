import { z } from "zod";

/** Shape returned by the public.check_in(token) database function. */
export const checkInResultSchema = z.object({
  status: z.enum(["checked_in", "already_checked_in", "invalid", "closed", "not_student"]),
  workshop_id: z.uuid().optional(),
  workshop_title: z.string().optional(),
});

export type CheckInResult = z.infer<typeof checkInResultSchema>;

/** Anything unexpected from the database is treated as an invalid code, never as success. */
export function parseCheckInResult(raw: unknown): CheckInResult {
  const parsed = checkInResultSchema.safeParse(raw);
  return parsed.success ? parsed.data : { status: "invalid" };
}

/** Check-in window, mirrored from public.check_in() for display only (the database enforces it). */
export const CHECK_IN_OPENS_MINUTES_BEFORE = 30;
export const CHECK_IN_CLOSES_MINUTES_AFTER = 60;

export function checkInWindow(startsAt: string, endsAt: string): { opensAt: Date; closesAt: Date } {
  return {
    opensAt: new Date(new Date(startsAt).getTime() - CHECK_IN_OPENS_MINUTES_BEFORE * 60_000),
    closesAt: new Date(new Date(endsAt).getTime() + CHECK_IN_CLOSES_MINUTES_AFTER * 60_000),
  };
}

export function checkInUrl(siteUrl: string, token: string): string {
  return `${siteUrl.replace(/\/+$/, "")}/check-in/${token}`;
}
