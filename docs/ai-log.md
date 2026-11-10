# AI-assisted development record

Tool: Claude Code (Claude Opus 5.5), used as a pair programmer. The developer reviewed, ran and approved each step.

| Date | Area | What the AI did | What the developer did |
|---|---|---|---|
| 2026-11-10 | Planning | Proposed architecture, schema/ERD, 7-day plan, risks | Wrote the project brief; approved the architecture; created the GitHub repo and Supabase project |
| 2026-11-10 | Database | Wrote the three migrations and the SQL permission test suite | Applied migrations (`npm run db:push`), generated types |
| 2026-11-10 | Testing | Built `npm run test:db`; two test expectations in the first draft were wrong and were corrected (schema unchanged): (1) a rating-range test used a non-attendee, so RLS rejected it before the CHECK constraint; (2) a student status update is filtered to 0 rows by RLS rather than raising an error | Reviewed results |
| 2026-11-10 | Auth | Supabase SSR clients, proxy session refresh, login/register/logout, role guards, UI primitives, unit tests | Configured Supabase Auth (email confirmation off) |
| 2026-11-10 | Workshops (Day 2) | Workshop CRUD, status lifecycle, student browsing, UK-time helpers + tests | Created and published workshops on the deployed site |
| 2026-11-10 | QR attendance (Day 3) | QR display/download, check-in page, attendance views, live smoke test | Deployed to Netlify; tested check-in with a real phone |
| 2026-11-10 | Engagement + Learning Pulse (Days 4–5) | Feedback, Pulse, requests, resources, insights, follow-up loop, dashboards, browser e2e script | Away; to review on return |
| 2026-11-10 | Documentation | README, architecture, database/ERD, testing, limitations, demo script, cleanup SQL | To review for accuracy before submission |
| 2026-11-10 | End-to-end testing | Ran the browser e2e suite; fixed a script bug (login wait), two missing confirmations (feedback/Pulse saved, request fulfilled) and a mobile table overflow; documented organiser demotion | Promoted the test organiser account in the SQL editor |

## Key prompts
- Initial brief: full project specification (scope, stack, security rules, timeline): "Start with the architecture proposal."
- "Professor accounts: how does it work?" → explained admin provisioning; added staff guidance on the register page.
- "Proceed with the rest of the features… ask only for the very necessary" → Days 4–5 built autonomously against the approved architecture.

## Manual changes by the developer
- Supabase project, Netlify site and environment variables set up by the developer.
- (Add any code you change by hand here, so the record stays accurate.)
