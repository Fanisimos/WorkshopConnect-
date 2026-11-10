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

## Outstanding issues

| # | Issue | Impact | Plan |
|---|---|---|---|
| 1 | University Wi-Fi blocks direct Postgres connections | `db:push`/`db:types` need another network | use hotspot; app itself works (HTTPS) |
| 2 | Supabase CLI v2.84 hangs at "Initialising login role" without a password | none with `scripts/with-db-password.sh` | optionally upgrade CLI to v3 later |
| 3 | DB tests use a stand-in for Supabase `auth` | small gap vs. real platform | spot-check key rules against live project on Day 6 |

## Known limitations (running list)

- One role per account; a person who is both student and organiser needs two accounts.
- Organisers are provisioned manually by an admin (`promote_to_organiser` in the SQL editor). Roadmap: university SSO with staff-group → role mapping, invite flow, admin screen.
- Email ownership is not verified (confirmation disabled for demos).
