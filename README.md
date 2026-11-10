# Workshop Connect+

A web platform for university skills workshops that connects **attendance → feedback → learning needs → follow-up support**.

Students check in with a QR code, rate the workshop, complete a short **Learning Pulse** (self-reported confidence and a topic they want more help with) and request extra resources. Organisers see attendance, feedback and grouped learning needs, share resources for a topic and mark requests as fulfilled. Students then see the response.

Kingston University · Professional Environments 2 · "Skills Workshop Nurture" scenario. Coursework prototype.

- **Live demo:** https://workshopconnectbravo11.netlify.app
- **Docs:** [architecture](docs/architecture.md) · [database & ERD](docs/database.md) · [testing](docs/testing.md) · [decisions](docs/decisions.md) · [limitations](docs/limitations.md) · [demo script](docs/demo-script.md) · [progress](docs/progress.md) · [AI-assistance record](docs/ai-log.md)

## Features

| Students | Organisers |
|---|---|
| Register, log in, log out | Log in (accounts are promoted by an admin) |
| Browse upcoming and past workshops | Create, edit, publish, complete, cancel workshops; delete drafts |
| Check in by scanning a QR code (duplicates rejected) | Show/download the check-in QR code; view attendance |
| Rate a workshop 1–5 with a comment | See average rating, distribution and comments (without names) |
| Learning Pulse: confidence before (retrospective) and now, plus a support topic | See average before / now / change and learning needs grouped by topic |
| Request extra resources and track status | Manage requests: pending → in progress → fulfilled, with a link and/or note |
| See shared resources and "resources for topics you asked about" | Share resources; one step to fulfil all open requests on a topic |

## Tech stack

Next.js 16 (App Router, Server Components, Server Actions) · React 19 · TypeScript (strict) · Tailwind CSS 4 · Supabase (Auth, Postgres, Row Level Security) · Zod · `qrcode` · deployed on Netlify.

Testing: Vitest (unit), plain-SQL permission tests on a throwaway local Postgres, a live smoke test, and a browser end-to-end test driving installed Chrome via `playwright-core`.

## Getting started

### 1. Prerequisites

- Node.js 24 and npm
- A Supabase project (free tier is fine)
- Supabase CLI (`brew install supabase/tap/supabase`)
- For `npm run test:db`: PostgreSQL 15+ binaries (`brew install postgresql@16`); Docker is **not** needed
- For `npm run test:e2e`: Google Chrome

### 2. Install and configure

```bash
npm install
cp .env.example .env.local   # then fill in the values (see below)
```

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → Data API → Project URL (no `/rest/v1` suffix) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API Keys → publishable key (or legacy anon key) |
| `NEXT_PUBLIC_SITE_URL` | Base URL encoded in QR codes, e.g. your deployed URL. Defaults to the host's URL on Netlify/Vercel, else `http://localhost:3000` |

Both Supabase values are safe in the browser: data access is enforced by Row Level Security. **Never** put the service-role/secret key in any `NEXT_PUBLIC_` variable. The app does not use it at all.

### 3. Set up the database

```bash
supabase login
supabase link --project-ref <your-project-ref>
npm run db:push     # applies supabase/migrations (prompts for the DB password)
npm run db:types    # regenerates src/lib/database.types.ts
```

Some university/corporate networks block direct Postgres connections. If `db:push` times out, use another network (e.g. a phone hotspot).

In Supabase → **Authentication → Sign In / Providers → Email**, turn **Confirm email** off for demos (the built-in email service is heavily rate-limited). See [limitations](docs/limitations.md).

### 4. Run

```bash
npm run dev        # http://localhost:3000
```

### 5. Create an organiser

Everyone registers as a student. To make someone an organiser, register them normally, then run in the Supabase **SQL Editor**:

```sql
select public.promote_to_organiser('person@example.ac.uk');
```

This function cannot be called from the app or the public API. Only an admin with dashboard access can run it.

To turn an organiser back into a student (same place):

```sql
update public.profiles set role = 'student'
where id = (select id from auth.users where email = 'person@example.ac.uk');
```

Workshops they created stay in the database but nobody can manage them until the account is promoted again.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Develop, build, serve |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm test` | Unit tests (Vitest) |
| `npm run test:db` | Applies all migrations to a throwaway local Postgres and runs the permission tests |
| `npm run test:live -- <url>` | Live smoke test against the real Supabase project and a running app |
| `npm run test:e2e -- <url>` | Browser end-to-end test of both journeys (needs Chrome and a promoted test organiser) |
| `npm run db:push` / `db:types` | Apply migrations / regenerate types (prompts for the DB password) |

`test:live` and `test:e2e` read test-account credentials from `.env.test.local` (gitignored):

```
SMOKE_EMAIL=...      # test student (registered automatically)
SMOKE_PASSWORD=...
ORG_EMAIL=...        # test organiser (register, then promote once)
ORG_PASSWORD=...
```

## Deployment (Netlify)

1. Import the GitHub repository in Netlify. The Next.js runtime is detected automatically (build command `npm run build`).
2. Site configuration → Environment variables: add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `NEXT_PUBLIC_SITE_URL` (your Netlify URL, no trailing slash).
3. Deploys → **Clear cache and deploy site**. `NEXT_PUBLIC_*` values are fixed at build time, so redeploy after changing them.
4. Supabase → Authentication → URL Configuration → set **Site URL** to the Netlify URL.

## Project structure

```
src/
  app/                    routes (App Router)
    (auth)/               login, register
    (student)/            dashboard, workshops, feedback, requests   (student-only layout)
    organiser/            dashboard, workshops, insights, follow-up, requests   (organiser-only layout)
    check-in/[token]/     QR destination
  features/<area>/        schema.ts (Zod) · queries.ts (reads) · actions.ts (Server Actions) · UI
  components/             shared UI primitives and layout
  lib/                    auth, Supabase clients, dates, env, helpers
  proxy.ts                session refresh + logged-out redirect
supabase/migrations/      schema, functions, RLS (SQL)
tests/unit/               Vitest
tests/db/                 SQL permission tests + Supabase stand-in
scripts/                  test runners and helpers
docs/                     documentation
```
