import type { Enums } from "@/lib/database.types";

export type Role = Enums<"user_role">;

/** Home page for each role. */
export function homePathFor(role: Role): string {
  return role === "organiser" ? "/organiser" : "/dashboard";
}

/**
 * Only allow same-site relative redirects after login. Rejects absolute URLs
 * and protocol-relative tricks such as //evil.example or /\evil.example,
 * which browsers treat as another site (an "open redirect").
 */
export function safeNextPath(next: unknown): string | null {
  if (typeof next !== "string" || next.length > 2048) return null;
  if (!next.startsWith("/")) return null;
  if (next.startsWith("//") || next.startsWith("/\\")) return null;
  // control characters (e.g. tabs/newlines) can be stripped by browsers, turning "/\t/evil" into "//evil"
  if (/[\u0000-\u001f\u007f]/.test(next)) return null;
  return next;
}
