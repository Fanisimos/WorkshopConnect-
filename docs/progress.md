# Progress checklist

Status key: ✅ done and verified · 🟡 built, verification pending · ⬜ not started
Evidence refers to [testing.md](testing.md).

## Core MVP

| Requirement | Status | Evidence |
|---|---|---|
| **A. Auth:** register, login, logout, sessions, protected routes | ✅ | live smoke (real session cookies on Netlify); login form driven in Chrome; developer used it on a phone |
| **A. Roles:** server-side role checks, RLS, no self-promotion, admin provisioning | ✅ | `test:db`, live smoke |
| **B. Workshops:** create (draft/publish), edit, status lifecycle, delete drafts; student browse + details | ✅ | developer created and published workshops on Netlify; `test:e2e` (form validation, publish, draft delete, complete) |
| **C. QR attendance:** per-workshop QR (SVG + PNG), mobile check-in, auth first, duplicates rejected, organiser list | ✅ | `test:db`; developer's real-phone test on Netlify; live smoke for invalid codes |
| **D. Feedback:** 1–5 + comment (attendees only); organiser average, distribution, comments | ✅ | `test:db`, unit tests, `test:e2e` |
| **E. Resource requests:** create, track status, organiser manage (pending → in progress → fulfilled), links/notes | ✅ | `test:db`, unit tests, `test:e2e` |

## Differentiators

| Feature | Status | Evidence |
|---|---|---|
| Learning Pulse (retrospective before, now, support topic), labelled as self-reported | ✅ | `test:db`, unit tests, `test:e2e` |
| Organiser insights: response count, average before / now / change, learning needs by topic, outstanding requests | ✅ | `tests/unit/insights.test.ts`, `test:e2e` |
| Close the loop: share a resource for a topic and fulfil matching open requests in one step | ✅ | `test:e2e` |
| Student: resources for topics they asked about; engagement history | ✅ | `test:e2e` |

## Deliverables

| Deliverable | Status |
|---|---|
| Source code on GitHub | ✅ |
| SQL migrations, schema, ERD | ✅ [database.md](database.md) |
| Architecture diagram | ✅ [architecture.md](architecture.md) |
| Testing evidence | ✅ [testing.md](testing.md) |
| README with setup, `.env.example`, deployment | ✅ |
| Known limitations | ✅ [limitations.md](limitations.md) |
| Decision log | ✅ [decisions.md](decisions.md) |
| Demo script | ✅ [demo-script.md](demo-script.md) |
| AI-assistance record | ✅ [ai-log.md](ai-log.md) |

## Outstanding issues

| # | Issue | Impact | Plan |
|---|---|---|---|
| 1 | ~~Test organiser not promoted~~ | resolved 2026-11-10 | developer ran `promote_to_organiser` |
| 2 | University Wi-Fi blocks direct Postgres connections | `db:push`/`db:types` need another network | use hotspot; the app itself works (HTTPS) |
| 3 | Supabase CLI v2.84 hangs without the DB password | none: `scripts/with-db-password.sh` prompts for it | optional CLI upgrade |
| 4 | Project lives in iCloud-synced Desktop; iCloud created duplicate `* 2.ts` files in `.next/` | broke type-check once | move project out of Desktop (developer's decision) |
| 5 | Netlify `NEXT_PUBLIC_SITE_URL` was localhost | QR pointed to localhost | developer to set it; app now falls back to Netlify's own URL |
| 6 | Test runs leave "[E2E test]" / "[Smoke test]" workshops | demo clutter | `scripts/cleanup-test-data.sql` before demos |
