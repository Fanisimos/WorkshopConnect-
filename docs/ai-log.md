# AI-assisted development record

Tool: Claude Code (Claude Opus 5.5), used as a pair programmer. The developer reviewed, ran and approved each step.

| Date | Area | What the AI did | What the developer did |
|---|---|---|---|
| 2026-11-10 | Planning | Proposed architecture, schema/ERD, 7-day plan, risks | Wrote the project brief; approved the architecture; created the GitHub repo and Supabase project |
| 2026-11-10 | Database | Wrote the three migrations and the SQL permission test suite | Applied migrations (`npm run db:push`), generated types |
| 2026-11-10 | Testing | Built `npm run test:db`; two test expectations in the first draft were wrong and were corrected (schema unchanged): (1) a rating-range test used a non-attendee, so RLS rejected it before the CHECK constraint; (2) a student status update is filtered to 0 rows by RLS rather than raising an error | Reviewed results |
| 2026-11-10 | Auth | Supabase SSR clients, proxy session refresh, login/register/logout, role guards, UI primitives, unit tests | — |

## Key prompts
- Initial brief: full project specification (scope, stack, security rules, timeline) — "Start with the architecture proposal."
