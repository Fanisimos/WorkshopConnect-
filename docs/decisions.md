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
| 13 | 2026-11-10 | Deploy on Netlify (developer's choice) instead of Vercel | Developer chose Netlify as the host; `@netlify/plugin-nextjs` supports App Router and proxy | QR codes depend on `NEXT_PUBLIC_SITE_URL` being the Netlify URL |
| 14 | 2026-11-10 | Workshops are single-day: one date with start and end times; times entered in UK local time | Matches how skills workshops run; simpler form; DST handled by `lib/dates.ts` | Multi-day events not supported |
| 15 | 2026-11-10 | Published workshops can't return to draft (complete/cancel instead) | Students may already have checked in; a draft is hidden from them | Organiser must cancel rather than unpublish |
| 16 | 2026-11-10 | Opening `/check-in/<token>` while logged in checks the student in immediately (no extra tap) | Fewest steps for students; safe because it requires a session, is idempotent (UNIQUE), and link previews carry no session | A student who opens a forwarded link while logged in is checked in; QR proves link possession, not presence |
| 17 | 2026-11-10 | QR rendered server-side as SVG (display) and PNG (download) with the `qrcode` library | No client JS; crisp on projectors; PNG for slides/printing | — |
| 18 | 2026-11-10 | Learning Pulse stored in its own table and shown as "step 2" after feedback, on one page | Keeps the differentiator separable from the core feedback feature; one page keeps it to a single sitting for students | Two submissions instead of one |
| 19 | 2026-11-10 | Topics: organiser-defined focus topics as chips, plus free text; grouped by lower-cased, trimmed text | Free text alone fragments ("joins" vs "SQL JOINs"); chips make insights meaningful without any AI | Synonyms are not merged |
| 20 | 2026-11-10 | Feedback comments and Pulse responses shown to organisers without names | Encourages honest feedback; organisers don't need names to act on themes | Presentation-only anonymity; stated in the UI and limitations |
| 21 | 2026-11-10 | Insight aggregation in pure TypeScript (`features/insights/compute.ts`) over RLS-filtered rows | Easy to unit-test and explain; data volumes are small | Would move to SQL views at larger scale |
| 22 | 2026-11-10 | Charts are plain HTML/CSS bars, colours validated for colour-blind separation and contrast; no chart library | Only bar comparisons are needed; values printed as text double as the table view | Less interactive than a chart library |
| 23 | 2026-11-10 | "Share resource for this topic" can fulfil every open request on that topic in one step | This is the follow-up loop the product is about; reduces organiser effort | A generic resource may not fully answer every individual request; organisers can untick it |
| 24 | 2026-11-10 | End-to-end tests use `playwright-core` driving the installed Chrome (dev dependency only) | Real browser evidence for both journeys without downloading browsers | Requires Chrome on the test machine |
