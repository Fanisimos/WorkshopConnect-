/**
 * Date/time helpers. The database stores UTC (timestamptz); people enter and
 * read times in UK local time (GMT in winter, BST in summer). Built on the
 * standard Intl API, so no date library is needed.
 */

export const APP_TIME_ZONE = "Europe/London";

/** Offset of APP_TIME_ZONE from UTC at a given instant, in minutes (BST = +60). */
function zoneOffsetMinutes(utcMillis: number): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIME_ZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(utcMillis));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asIfUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return Math.round((asIfUtc - utcMillis) / 60_000);
}

/**
 * "2026-11-12" + "14:00" in UK local time → UTC ISO string.
 * Returns null for impossible dates (e.g. 2026-02-30).
 */
export function ukLocalToUtcIso(date: string, time: string): string | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^(\d{2}):(\d{2})$/.exec(time);
  if (!d || !t) return null;
  const [year, month, day, hour, minute] = [d[1], d[2], d[3], t[1], t[2]].map(Number);
  if (hour > 23 || minute > 59) return null;

  const naive = Date.UTC(year, month - 1, day, hour, minute);
  const check = new Date(naive);
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
    return null;
  }
  // Two passes handle the hour either side of a clock change.
  let utc = naive - zoneOffsetMinutes(naive) * 60_000;
  utc = naive - zoneOffsetMinutes(utc) * 60_000;
  return new Date(utc).toISOString();
}

/** UTC ISO string → { date: "YYYY-MM-DD", time: "HH:mm" } in UK local time (for form defaults). */
export function utcIsoToUkLocal(iso: string): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIME_ZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
}

/** e.g. "Thu 12 Nov 2026" */
export function formatDate(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIME_ZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("weekday")} ${get("day")} ${get("month")} ${get("year")}`;
}

/** e.g. "14:00" */
export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}

/** e.g. "Thu 12 Nov 2026, 14:00–16:00" */
export function formatTimeRange(startIso: string, endIso: string): string {
  return `${formatDate(startIso)}, ${formatTime(startIso)}–${formatTime(endIso)}`;
}

/** e.g. "12 Nov 2026, 14:03" — for timestamps such as check-in times */
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIME_ZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}
