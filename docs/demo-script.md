# Demo script (3–5 minutes)

A fictional example: **Priya**, a second-year student, attends an **"SQL for Beginners"** workshop run by **Dr Ellis**, an academic skills tutor. (Fictional people; no real data.)

## Before the demo (10 minutes, the day before)

- [ ] Open the Supabase dashboard so the free-tier project is awake.
- [ ] Run `scripts/cleanup-test-data.sql` in the SQL editor to remove automated-test workshops.
- [ ] Mark any old practice workshops **Completed** (or Cancelled) so students only see the demo workshop as current.
- [ ] Accounts ready: one **organiser** (promoted) and one **student**, logged in on two devices or two browser profiles (laptop = organiser, phone = student).
- [ ] As the organiser, create **"SQL for Beginners"** starting a few minutes before the demo, focus topics `SQL JOINs, GROUP BY, Subqueries`, and **Publish**.
- [ ] Optional, for richer insights: have 2–3 classmates check in and complete feedback beforehand. Do **not** present invented numbers as real usage.
- [ ] Check the QR page shows the Netlify URL (not localhost).

## Script

**1. The problem (30 s)**
> "Universities run lots of skills workshops. They usually record who attended and collect a feedback form, but nothing makes sure the students who are still stuck actually get follow-up help. Workshop Connect+ closes that loop: attendance → feedback → learning needs → follow-up."

**2. Organiser sets up (45 s)**: laptop, organiser account
- Dashboard → **New workshop** (show the form briefly; it's already created) → open "SQL for Beginners".
- Click **Show check-in QR**. "This goes on the projector at the start of the session."

**3. Student checks in (30 s)**: phone, student account
- Scan the QR code with the phone camera → **"You're checked in"**.
- Scan again → **"Already checked in"**. "Duplicates are blocked by the database, not just the screen."
- Laptop: refresh the workshop page → Priya appears in the attendance list.

**4. Feedback and Learning Pulse (60 s)**: phone
- Tap **Go to workshop → Give feedback**. Rate **4/5**, comment "Clear examples, but JOINs went fast."
- Learning Pulse: *Looking back, how confident were you before?* **2**. *How confident now?* **4**. Topic: **SQL JOINs**.
- "Note the wording: 'before' is a retrospective self-rating. We show it as a self-reported indicator, not as proof of learning."
- **Request resources**: topic SQL JOINs, "Practice exercises on LEFT vs INNER JOIN, please." → My requests shows **Pending**.

**5. Organiser sees the learning need (45 s)**: laptop
- Open **Feedback & insights**: rating, confidence before vs now, and the **Learning needs** table: *SQL JOINs*, Pulse 1, Requests 1, Open 1.
- "With a real cohort, this is where you'd see ten students asking for the same thing."

**6. Close the loop (45 s)**: laptop
- Click **Share resource** next to SQL JOINs → title "SQL JOINs practice set", paste an https link. Leave **"Also mark the 1 open request as fulfilled"** ticked → **Share resource**.
- "One action shares the resource with everyone and answers every student who asked about that topic."

**7. Student gets the answer (30 s)**: phone
- **My requests** → **Fulfilled**, with the link. Dashboard → **Resources for topics you asked about**.

**8. Close (20 s)**
> "Security is enforced in the database with Row Level Security: students can't see each other's data, can't make themselves organisers, and organisers only see their own workshops. We test that with 91 automated database checks, and both journeys run end to end in a real browser against the live site."

## If something goes wrong

| Problem | Fallback |
|---|---|
| Phone can't reach the site / Wi-Fi blocks it | Use mobile data; or open the check-in URL shown under the QR code on the laptop in a second browser profile |
| "Check-in isn't open" | Workshop start must be within 30 minutes (or end within the last 60); edit the times |
| Supabase is slow on first load | It was paused; wait 10–20 s and reload |

## Questions to expect, and honest answers

- *Does the QR prove they were in the room?* No. It proves they opened the link while logged in. Rotating codes are on the roadmap.
- *Is the confidence change real learning?* No. It's self-reported; we label it that way.
- *Who can see my feedback?* The workshop's organiser sees comments without names in the dashboard; the database links them to the account.
- *What needs validating next?* Whether organisers would act on topic demand; whether students complete the Pulse; whether skills teams would adopt it. These are hypotheses, not findings.
