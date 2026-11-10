# Technical decision log

| # | Date | Decision | Why | Trade-off |
|---|---|---|---|---|
| 1 | 2026-11-10 | Single Next.js app (App Router) + Supabase; no separate backend | Smallest architecture that meets the brief; easy to explain | Business logic lives in Server Actions and SQL |
| 2 | 2026-11-10 | The app never uses the service-role key; every query runs as the logged-in user | RLS applies to every request, so a bug in app code cannot bypass permissions | Privileged steps (organiser provisioning) are done by an admin in the SQL editor |
| 3 | 2026-11-10 | Role stored in `profiles.role`, always `student` on sign-up; users may only update `full_name` (column grant) | Students can never self-assign organiser rights, even via the API | Organisers must be promoted manually (`promote_to_organiser`) |
| 4 | 2026-11-10 | Check-in only through `check_in(token)` (SECURITY DEFINER); no direct INSERT on attendance | Enforces token, status, time window and identity in one audited place | A static QR still proves possession of the link, not physical presence |
| 5 | 2026-11-10 | QR tokens in a separate owner-only table | RLS cannot hide one column from students while showing it to organisers | One extra 1:1 table |
| 6 | 2026-11-10 | `student_id` columns default to `auth.uid()` and are not grantable on insert | The client never supplies a student id | — |
| 7 | 2026-11-10 | Organisers see student data only for workshops they own | Privacy: no access to unrelated students | Shared team ownership would need a later change |
| 8 | 2026-11-10 | Workshops with attendance cannot be deleted (FK RESTRICT); only drafts | Prevents accidental loss of records | Organisers cancel instead of delete |
| 9 | 2026-11-10 | `cacheComponents` turned off in `next.config.ts` | Nearly every page is per-user; request-time rendering is simpler and cannot leak cached data between users | Gives up static-shell prefetching, irrelevant for this app |
| 10 | 2026-11-10 | No component library; ~6 hand-written Tailwind primitives | Forms and cards only; native elements are accessible; fewer dependencies | Revisit if dialogs/menus are needed |
| 11 | 2026-11-10 | DB permission tests in plain SQL against a throwaway local Postgres (`npm run test:db`) | No Docker on the dev machine; no secrets needed; fast and repeatable | Uses a small stand-in for Supabase `auth` (see progress.md, issue 3) |
| 12 | 2026-11-10 | Email confirmation disabled in Supabase Auth | Built-in email is heavily rate-limited; would break demos | Email ownership is not verified (documented limitation) |
