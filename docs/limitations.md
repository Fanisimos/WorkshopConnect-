# Known limitations

Honest limits of the MVP, and what a production version would need.

## Attendance

- **A QR code proves possession of the link, not physical presence.** The code is static per workshop and can be shared (e.g. photographed and sent to a friend), who could then check in while logged in during the check-in window. Mitigations would be rotating codes, a short-lived token shown on screen, or an organiser-side confirmation; none are implemented.
- **Opening a check-in link while logged in checks you in immediately** (no confirmation tap). This was a deliberate trade-off for speed; see decision 16.
- Check-in window is fixed: 30 minutes before start to 60 minutes after end. It is not configurable per workshop.

## Learning Pulse

- **"Before" confidence is rated retrospectively**, after the workshop, so it is subject to recall bias. It is not equivalent to a pre-workshop measurement.
- **Confidence change is self-reported and subjective.** It is not evidence of learning and must not be presented as such.
- Small numbers of responses make averages unreliable; the UI shows the response count next to every average.

## Accounts and roles

- **Organisers are promoted manually** by an admin in the Supabase SQL editor (`promote_to_organiser`). Roadmap: university single sign-on (staff groups → organiser role), an invite flow, or an admin screen.
- **One role per account.** Someone who is both a student and an organiser needs two accounts.
- **Email ownership is not verified**: email confirmation is turned off for demos because Supabase's built-in email is heavily rate-limited. Production would use a proper email provider and turn confirmation on.
- Any email address can register; there is no restriction to a university domain.
- No password-reset page (Supabase supports it; not built).
- Organisers only see their own workshops. Shared team ownership is not supported.

## Privacy

- Feedback comments and Learning Pulse responses are **shown to organisers without names**, but this is a presentation choice: the rows are linked to the student's account in the database and an organiser with API skills could look up who wrote them for their own workshops. This is stated to students in the UI.
- Students' names are visible to the organiser of a workshop they attended or requested resources for (needed for attendance and follow-up).

## Product scope

- Workshops are single-day (one date with start and end times), times are UK time only.
- No notifications (by design for the MVP): students check "My requests" for updates.
- Feedback and Learning Pulse cannot be edited after submission.
- No export (CSV) of attendance or feedback.
- Topic grouping is by exact text after lower-casing and trimming. "JOINs" and "SQL JOINs" count as different topics; organiser-defined focus topics reduce this.
- Light theme only.

## Engineering

- **Database tests use a stand-in for Supabase's `auth` schema** on a local Postgres (`tests/db/supabase_stub.sql`). Key rules are additionally checked against the live project by `npm run test:live`.
- End-to-end tests run against the shared Supabase project and leave "[E2E test]" / "[Smoke test]" workshops behind (marked completed). Use `scripts/cleanup-test-data.sql` before a demo.
- Supabase free-tier projects pause after a period of inactivity; open the dashboard before a demo.
- The Supabase CLI (v2.84) needs the database password supplied (`npm run db:push` prompts for it), and direct database connections are blocked on some university networks.
