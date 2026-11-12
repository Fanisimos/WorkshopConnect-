# Testing

Four layers, from fastest to most realistic. Results below are only those that actually ran; each entry gives the date and command.

| Layer | Command | What it covers | Needs |
|---|---|---|---|
| Unit | `npm test` | Validation schemas, redirect guard, UK time conversion, check-in result parsing, status transitions, insight calculations | nothing |
| Database permissions | `npm run test:db` | Every migration applied to a throwaway Postgres; RLS, grants, constraints, `check_in()`, provisioning, as real `anon` / student / organiser roles | local Postgres 15+ |
| Live smoke | `npm run test:live -- <url>` | Real Supabase project + running app: role rules via the public API, page access and redirects, full QR check-in flow | `.env.test.local` |
| Browser end-to-end | `npm run test:e2e -- <url>` | Both journeys through the real UI in Chrome: login forms, create/publish workshop, QR, check-in, feedback, Learning Pulse, requests, insights, share-for-topic, fulfil, drafts | Chrome, promoted test organiser |

## Results log

| Date | Command | Target | Result |
|---|---|---|---|
| 2026-11-10 | `npm test` | — | 77 tests passed |
| 2026-11-10 | `npm run test:db` | local Postgres 16 | 91 checks passed |
| 2026-11-10 | `npm run test:live` | https://workshopconnectbravo11.netlify.app | student section (14 checks) passed; organiser section skipped (test organiser not yet promoted) |
| 2026-11-10 | manual, real phone | Netlify | developer scanned a workshop QR with a phone: check-in recorded; "check-in isn't open" shown for a future workshop; dashboard showed the attended workshop |
| 2026-11-10 | `npm run test:e2e` | localhost (dev server) | **28/28 checks passed** after the fixes listed below |
| 2026-11-10 | `npm run test:e2e` | https://workshopconnectbravo11.netlify.app (commit 74f6ede) | **28/28 checks passed** |
| 2026-11-10 | `npm run test:live` | https://workshopconnectbravo11.netlify.app (commit 74f6ede) | **26/26 checks passed** (student and organiser sections) |

Issues found by the first end-to-end runs (2026-11-10):
- **Script bug:** the login helper treated `/login` itself as "landed", so it reported the organiser as not promoted. Fixed in the script.
- **App bug (UX):** after submitting feedback or the Learning Pulse, the page refreshed into the saved view and the "thanks" message never appeared. The saved views now show the confirmation.
- **App bug (UX):** after fulfilling a request, the card moved into the collapsed "Fulfilled" list with no confirmation. The organiser now returns to the same page with a "Request fulfilled" banner.
- **App bug (layout):** the Learning needs table's "Share" link was cut off at 390px width. Tightened for phones.
- **Script robustness:** each run's workshop title is now unique, and student checks are scoped to that run's workshop (earlier runs leave data behind).

Corrections made while writing tests (code unchanged unless stated):
- Two expectations in the first database-test draft were wrong: a rating-range test used a non-attendee, so RLS rejected it before the CHECK constraint; and a student updating a request status is filtered to 0 rows by RLS rather than raising an error. The tests were corrected; the schema was not changed.

## Real-user trial

**2026-11-12, small group of fellow students, deployed site.** Numbers as reported by the developer, who ran the session as organiser.

| Step | Result |
|---|---|
| QR check-in on students' own phones | 4 students checked in, with no help needed |
| Feedback rating | 2 of 4 gave a rating |
| Feedback comment | 1 comment, off-topic (a joke asking for lunch suggestions) |
| Learning Pulse | 2 of 4 completed it: 1 felt about the same, 1 felt more confident (rated 4/5 "now") |
| Resource requests | not reported |

Observations:
- Check-in worked first time on real devices, which was the riskiest step of the loop.
- Half of those who checked in left feedback. Nothing in the app reminds students to give feedback after they leave the session (no notifications by design; see [limitations](limitations.md)), so asking the group in the room matters.
- Free-text comments can be off-topic. Organisers see them without names and cannot hide them. Hiding or flagging comments is a possible improvement; it is not built.
- The Learning Pulse insight panel showed the split as intended (1 more confident, 1 about the same). These are self-reported feelings, not evidence of learning.
- Four people is far too few to draw conclusions about ratings or confidence change.

## Database permission checks (`tests/db/rls.test.sql`)

Highlights of the 91 checks:

- **Roles:** sign-up always creates a student even if metadata says organiser; students can't change their role, insert profiles, or call `promote_to_organiser`; anonymous users can't read any table or call `check_in`.
- **Workshops:** students see published workshops only, can't create/edit/delete; organisers can't create on behalf of another organiser or edit another organiser's workshop; published workshops and workshops with attendance can't be deleted.
- **QR & attendance:** students can't read tokens or insert attendance directly; `check_in()` records the authenticated student, returns `already_checked_in` on repeat, `invalid` for unknown tokens, `closed` outside the window or for drafts, `not_student` for organisers; the UNIQUE constraint rejects duplicates even bypassing the function.
- **Feedback & Learning Pulse:** attendees only; `student_id` comes from the session and can't be supplied; one per student per workshop; no edits; 1–5 ranges; `confidence_change = after - before`.
- **Requests & resources:** students' requests always start `pending`; students can't set or change status or edit text; organisers can't rewrite the student's text; fulfilled requires a resource or note; resources must be https and belong to the same workshop; a resource used to fulfil a request can't be deleted.
- **Privacy:** students can't see each other's attendance, feedback, pulse, requests or profiles; organisers see only students linked to their own workshops; a second organiser sees none of the first organiser's student data.

## Manual acceptance tests

Run on a phone (student) and a laptop (organiser). Tick when verified by hand on the deployed site.

Most steps are also covered automatically by `test:e2e` and `test:live` (both passed on Netlify on 2026-11-10). This list is for a human walk-through on a real phone, which the automated tests can't replace (camera scanning, real screen sizes, how it feels to use).

### Student journey
- [ ] Register → lands on dashboard
- [ ] Log out, log in again
- [ ] Browse workshops → open one
- [ ] Scan the QR code → "You're checked in" (verified manually on 2026-11-10)
- [ ] Scan again → "Already checked in"
- [ ] Give feedback (try submitting without a rating first → error shown)
- [ ] Complete the Learning Pulse
- [ ] Request resources → appears as Pending in My requests
- [ ] After the organiser responds → Fulfilled with link/note

### Organiser journey
- [ ] Log in → organiser dashboard
- [ ] Create a workshop (try an end time before the start → error shown) → Publish
- [ ] Show QR code → download PNG
- [ ] Attendance list shows the student
- [ ] Feedback & insights shows rating, Learning Pulse and learning needs
- [ ] Share resource for a topic → matching request fulfilled
- [ ] Respond to another request with a note
- [ ] Complete / cancel / reopen a workshop; delete a draft

### Security checks
- [ ] As a student, open `/organiser` → redirected to the student dashboard
- [ ] As a student, open `/organiser/workshops/<id>/qr/download` → not allowed
- [ ] Logged out, open `/dashboard` → redirected to login
- [ ] Mobile layout: every page usable at 390px width (screenshots on 2026-11-10: student pages, and organiser QR, insights, follow-up and dashboard from the e2e run)
