-- =====================================================================
-- Remove automated-test data before a demo.
-- Run in the Supabase SQL Editor (it needs admin rights, because test
-- workshops have attendance and cannot be deleted through the app).
--
-- Deletes every workshop whose title starts with "[E2E test]" or
-- "[Smoke test]", together with its attendance, feedback, Learning Pulse
-- responses, requests and resources. Nothing else is touched.
-- Optionally (bottom) deletes the two test accounts.
-- =====================================================================
begin;

create temp table test_workshops on commit drop as
  select id from public.workshops
  where title like '[E2E test]%' or title like '[Smoke test]%';

delete from public.resource_requests        where workshop_id in (select id from test_workshops);
delete from public.learning_pulse_responses where workshop_id in (select id from test_workshops);
delete from public.feedback                 where workshop_id in (select id from test_workshops);
delete from public.attendance               where workshop_id in (select id from test_workshops);
delete from public.resources                where workshop_id in (select id from test_workshops);
delete from public.workshops                where id          in (select id from test_workshops);

-- Optional: also remove the test accounts (cascades to their remaining rows).
-- delete from auth.users where email in ('xspot1995+wcstudent@hotmail.com', 'xspot1995+wcorganiser@hotmail.com');

commit;
