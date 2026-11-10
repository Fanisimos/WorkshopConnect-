# Progress checklist

Status key: ✅ done and verified · 🟡 built, not yet verified end to end · ⬜ not started

## Day 1 — Foundation (2026-11-10)

| Item | Status | Evidence |
|---|---|---|
| Standalone git repo, remote `Fanisimos/WorkshopConnect-` | ✅ | `git remote -v` |
| Next.js 16.4 + React 19 + TS strict + Tailwind 4 scaffold | ✅ | `npm run build` passes |
| Database schema, constraints, indexes | ✅ | applied to Supabase via `npm run db:push` |
| RLS policies + column grants | ✅ | `npm run test:db` (85 assertions, local Postgres) |
| `check_in()` and `promote_to_organiser()` functions | ✅ | `npm run test:db` |
| Anonymous access blocked on live project | ✅ | manual REST calls with publishable key → `42501` on all tables and RPCs |
| TypeScript types generated from live schema | ✅ | `src/lib/database.types.ts` via `npm run db:types` |
| Session refresh + logged-out redirect (proxy) | ✅ | curl: protected routes → 307 `/login?next=…` |
| Register / login / logout pages + Server Actions | 🟡 | builds and renders; needs a browser run against Supabase |
| Role-guarded student and organiser layouts | 🟡 | needs a student and an organiser account to verify |
| Unit tests (redirect guard, auth validation) | ✅ | `npm test` (20 tests) |

## Day 2 — Workshops (2026-11-10)

| Item | Status | Evidence |
|---|---|---|
| Organiser: create (draft or publish), edit, list own workshops | 🟡 | builds, typed, validated; needs browser run as organiser |
| Organiser: status lifecycle (publish → complete/cancel → reopen), delete drafts only | 🟡 | transition rules unit-tested; DB rules in `test:db` |
| Student: browse upcoming/past workshops, workshop details, "Hosted by" | 🟡 | builds; needs browser run |
| Dashboards show real data (no mock data) | 🟡 | — |
| UK time handling (GMT/BST) for workshop times | ✅ | `tests/unit/dates.test.ts` incl. both 2026 clock changes |
| Friendly error and 404 pages | ✅ | build |
| Live smoke test script (`scripts/smoke-live.mjs`) | 🟡 | blocked: needs a real email domain (Supabase rejects example.com) |

## Day 3 — QR attendance (2026-11-10)

| Item | Status | Evidence |
|---|---|---|
| QR code per workshop (on-screen SVG + PNG download), encodes `NEXT_PUBLIC_SITE_URL/check-in/<token>` | 🟡 | build; live check waits for organiser test account |
| Mobile check-in page: login → back to check-in → result (checked in / already / closed / invalid / organiser) | 🟡 | "invalid code" path verified live; full path waits for organiser |
| Duplicate check-ins rejected (DB UNIQUE + friendly "Already checked in") | ✅ | `test:db`; live re-check pending |
| Organiser attendance list (name + check-in time) | 🟡 | waits for organiser test account |
| Student: "You attended" on workshop page; attended list on dashboard | 🟡 | waits for organiser test account |
| Live smoke test covers student rules + full QR flow (`npm run test:live -- <url>`) | 🟡 | student part ✅ (14 checks); organiser part skips until promoted |

## Outstanding issues

| # | Issue | Impact | Plan |
|---|---|---|---|
| 1 | University Wi-Fi blocks direct Postgres connections | `db:push`/`db:types` need another network | use hotspot; app itself works (HTTPS) |
| 2 | Supabase CLI v2.84 hangs at "Initialising login role" without a password | none with `scripts/with-db-password.sh` | optionally upgrade CLI to v3 later |
| 3 | DB tests use a stand-in for Supabase `auth` | small gap vs. real platform | `scripts/smoke-live.mjs` checks key rules on the live project |
| 4 | Netlify build needs env vars set in Netlify UI | deploy fails until set | see README (to write) / chat instructions |

## Known limitations (running list)

- One role per account; a person who is both student and organiser needs two accounts.
- Organisers are provisioned manually by an admin (`promote_to_organiser` in the SQL editor). Roadmap: university SSO with staff-group → role mapping, invite flow, admin screen.
- Email ownership is not verified (confirmation disabled for demos).
