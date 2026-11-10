-- =====================================================================
-- Database permission tests (RLS, grants, constraints, check-in).
-- Run with: npm run test:db   (see scripts/test-db.sh)
-- Each assertion prints "ok - ..." or aborts with "not ok - ...".
-- Everything runs inside one transaction that is rolled back.
-- =====================================================================
\set ON_ERROR_STOP 1
\set QUIET 1
begin;

-- ---------------------------------------------------------------------
-- Test helpers (security invoker: they run with the CURRENT role, so
-- statements executed through them are subject to RLS as that user)
-- ---------------------------------------------------------------------
create schema tests;
grant usage on schema tests to anon, authenticated;

create function tests.ok(cond boolean, descr text) returns void
language plpgsql as $$
begin
  if cond is distinct from true then
    raise exception 'not ok - %', descr;
  end if;
  raise notice 'ok - %', descr;
end $$;

-- statement must fail with the given SQLSTATE
create function tests.throws(stmt text, expected_state text, descr text) returns void
language plpgsql as $$
declare st text; msg text;
begin
  begin
    execute stmt;
  exception when others then
    get stacked diagnostics st = returned_sqlstate, msg = message_text;
    if st = expected_state then
      raise notice 'ok - % [%]', descr, st;
      return;
    end if;
    raise exception 'not ok - %: expected SQLSTATE %, got % (%)', descr, expected_state, st, msg;
  end;
  raise exception 'not ok - %: expected SQLSTATE %, but statement succeeded', descr, expected_state;
end $$;

-- number of rows a query returns for the current user
create function tests.count_rows(query text) returns bigint
language plpgsql as $$
declare n bigint;
begin
  execute format('select count(*) from (%s) q', query) into n;
  return n;
end $$;

-- number of rows a write statement affected for the current user
create function tests.affected(stmt text) returns bigint
language plpgsql as $$
declare n bigint;
begin
  execute stmt;
  get diagnostics n = row_count;
  return n;
end $$;

-- act as a logged-in user (what PostgREST does for each API request)
create function tests.become(uid uuid) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', uid::text, true);
  perform set_config('role', 'authenticated', true);
end $$;

create function tests.become_anon() returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('role', 'anon', true);
end $$;

grant execute on all functions in schema tests to anon, authenticated;

-- ---------------------------------------------------------------------
-- Fixtures (as postgres / admin)
--   A, B = students     O1, O2 = organisers
--   W1 = O1, published, check-in open now
--   W2 = O1, draft
--   W3 = O2, published, next month (check-in closed)
-- ---------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data) values
  ('a0000000-0000-0000-0000-00000000000a', 'student.a@example.test', '{"full_name":"Alex Student","role":"organiser"}'),
  ('b0000000-0000-0000-0000-00000000000b', 'student.b@example.test', '{"full_name":"Bo Student"}'),
  ('01000000-0000-0000-0000-000000000001', 'org.one@example.test',   '{"full_name":"Olu Organiser"}'),
  ('02000000-0000-0000-0000-000000000002', 'org.two@example.test',   '{"full_name":"Oti Organiser"}');

select tests.ok(
  (select role from public.profiles where id = 'a0000000-0000-0000-0000-00000000000a') = 'student',
  'sign-up creates a STUDENT profile even when metadata claims role=organiser');

select public.promote_to_organiser('org.one@example.test');
select public.promote_to_organiser('ORG.TWO@example.test');
select tests.ok((select count(*) from public.profiles where role = 'organiser') = 2,
  'admin can promote organisers by email (case-insensitive)');

insert into public.workshops (id, organiser_id, title, location, starts_at, ends_at, status) values
  ('11111111-0000-0000-0000-000000000001', '01000000-0000-0000-0000-000000000001',
   'Intro to SQL', 'Room 101', now() - interval '10 minutes', now() + interval '50 minutes', 'published'),
  ('11111111-0000-0000-0000-000000000002', '01000000-0000-0000-0000-000000000001',
   'Draft workshop', 'Room 102', now() + interval '1 day', now() + interval '1 day 1 hour', 'draft'),
  ('11111111-0000-0000-0000-000000000003', '02000000-0000-0000-0000-000000000002',
   'Academic Writing', 'Library', now() + interval '30 days', now() + interval '30 days 1 hour', 'published');

select tests.ok((select count(*) from public.workshop_qr_tokens) = 3,
  'every new workshop automatically gets a QR token');

-- keep tokens handy for later (as admin)
create temp table t_tokens as select workshop_id, token from public.workshop_qr_tokens;
grant select on t_tokens to anon, authenticated;

-- =====================================================================
-- Anonymous users
-- =====================================================================
select tests.become_anon();
select tests.throws('select * from public.workshops', '42501', 'anon cannot read workshops');
select tests.throws('select * from public.profiles',  '42501', 'anon cannot read profiles');
select tests.throws(format('select public.check_in(%L)', (select token from t_tokens limit 1)),
  '42501', 'anon cannot call check_in');
reset role;

-- =====================================================================
-- Student A: profiles and role escalation
-- =====================================================================
select tests.become('a0000000-0000-0000-0000-00000000000a');

select tests.throws($$update public.profiles set role = 'organiser' where id = auth.uid()$$,
  '42501', 'student cannot change their own role');
select tests.ok(tests.affected($$update public.profiles set full_name = 'Alex S.' where id = auth.uid()$$) = 1,
  'student can update their own full_name');
select tests.ok(tests.affected($$update public.profiles set full_name = 'Hacked' where id = 'b0000000-0000-0000-0000-00000000000b'$$) = 0,
  'student cannot update another student''s profile');
select tests.throws($$insert into public.profiles (id, full_name, role) values (gen_random_uuid(), 'x', 'organiser')$$,
  '42501', 'student cannot insert profiles');
select tests.ok(tests.count_rows($$select * from public.profiles where id = 'b0000000-0000-0000-0000-00000000000b'$$) = 0,
  'student cannot read another student''s profile');
select tests.ok(tests.count_rows($$select * from public.profiles where role = 'organiser'$$) = 2,
  'student can read organiser names (for "Hosted by")');
select tests.throws($$select public.promote_to_organiser('student.a@example.test')$$,
  '42501', 'student cannot call promote_to_organiser');

-- =====================================================================
-- Student A: workshops and QR tokens
-- =====================================================================
select tests.ok(tests.count_rows('select * from public.workshops') = 2,
  'student sees published workshops only (not drafts)');
select tests.throws($$insert into public.workshops (title, location, starts_at, ends_at)
                      values ('Fake', 'Nowhere', now(), now() + interval '1 hour')$$,
  '42501', 'student cannot create a workshop');
select tests.ok(tests.affected($$update public.workshops set title = 'Hacked'$$) = 0,
  'student cannot edit workshops');
select tests.ok(tests.affected($$delete from public.workshops$$) = 0,
  'student cannot delete workshops');
select tests.ok(tests.count_rows('select * from public.workshop_qr_tokens') = 0,
  'student cannot read any QR tokens');

-- =====================================================================
-- Check-in
-- =====================================================================
select tests.throws($$insert into public.attendance (student_id, workshop_id)
                      values (auth.uid(), '11111111-0000-0000-0000-000000000001')$$,
  '42501', 'student cannot insert attendance directly (must use check_in)');

select tests.ok(
  (public.check_in((select token from t_tokens where workshop_id = '11111111-0000-0000-0000-000000000001')) ->> 'status') = 'checked_in',
  'valid token inside the window checks the student in');
select tests.ok(
  (select student_id from public.attendance where workshop_id = '11111111-0000-0000-0000-000000000001')
    = 'a0000000-0000-0000-0000-00000000000a',
  'attendance is recorded against the authenticated student');
select tests.ok(
  (public.check_in((select token from t_tokens where workshop_id = '11111111-0000-0000-0000-000000000001')) ->> 'status') = 'already_checked_in',
  'second scan returns already_checked_in');
select tests.ok(tests.count_rows('select * from public.attendance') = 1,
  'duplicate scan does not create a second attendance row');
select tests.ok((public.check_in(gen_random_uuid()) ->> 'status') = 'invalid',
  'unknown token returns invalid');
select tests.ok(
  (public.check_in((select token from t_tokens where workshop_id = '11111111-0000-0000-0000-000000000003')) ->> 'status') = 'closed',
  'workshop outside its check-in window returns closed');
select tests.ok(
  (public.check_in((select token from t_tokens where workshop_id = '11111111-0000-0000-0000-000000000002')) ->> 'status') = 'closed',
  'draft workshop returns closed');
reset role;

-- the UNIQUE constraint itself (bypassing check_in) — as admin
select tests.throws($$insert into public.attendance (student_id, workshop_id)
                      values ('a0000000-0000-0000-0000-00000000000a', '11111111-0000-0000-0000-000000000001')$$,
  '23505', 'database UNIQUE constraint rejects duplicate attendance');

-- =====================================================================
-- Feedback and Learning Pulse
-- =====================================================================
select tests.become('a0000000-0000-0000-0000-00000000000a');
select tests.throws($$insert into public.feedback (workshop_id, rating)
                      values ('11111111-0000-0000-0000-000000000001', 6)$$,
  '23514', 'rating outside 1-5 is rejected');
select tests.throws($$insert into public.learning_pulse_responses (workshop_id, confidence_before, confidence_after)
                      values ('11111111-0000-0000-0000-000000000001', 0, 5)$$,
  '23514', 'confidence ratings outside 1-5 are rejected');
select tests.ok(tests.affected($$insert into public.feedback (workshop_id, rating, comment)
                                 values ('11111111-0000-0000-0000-000000000001', 4, 'Great examples')$$) = 1,
  'attendee can submit feedback');
select tests.ok((select student_id from public.feedback limit 1) = 'a0000000-0000-0000-0000-00000000000a',
  'feedback student_id is set from the session, not the client');
select tests.throws($$insert into public.feedback (student_id, workshop_id, rating)
                      values ('b0000000-0000-0000-0000-00000000000b', '11111111-0000-0000-0000-000000000001', 1)$$,
  '42501', 'student cannot submit feedback as someone else');
select tests.throws($$insert into public.feedback (workshop_id, rating)
                      values ('11111111-0000-0000-0000-000000000001', 5)$$,
  '23505', 'duplicate feedback for the same workshop is rejected');
select tests.throws($$insert into public.feedback (workshop_id, rating)
                      values ('11111111-0000-0000-0000-000000000003', 5)$$,
  '42501', 'student cannot give feedback on a workshop they did not attend');
select tests.throws($$update public.feedback set rating = 1$$,
  '42501', 'feedback cannot be edited after submission');

select tests.ok(tests.affected($$insert into public.learning_pulse_responses
                                   (workshop_id, confidence_before, confidence_after, support_topic)
                                 values ('11111111-0000-0000-0000-000000000001', 2, 4, 'SQL JOINs')$$) = 1,
  'attendee can submit a Learning Pulse');
select tests.ok((select confidence_change from public.learning_pulse_responses limit 1) = 2,
  'confidence_change = after - before (2 -> 4 = +2)');
select tests.throws($$insert into public.learning_pulse_responses (workshop_id, confidence_before, confidence_after)
                      values ('11111111-0000-0000-0000-000000000001', 3, 3)$$,
  '23505', 'only one Learning Pulse per student per workshop');
select tests.throws($$update public.learning_pulse_responses set confidence_after = 5$$,
  '42501', 'Learning Pulse cannot be edited after submission');
reset role;

select tests.become('b0000000-0000-0000-0000-00000000000b');
select tests.throws($$insert into public.feedback (workshop_id, rating)
                      values ('11111111-0000-0000-0000-000000000001', 3)$$,
  '42501', 'non-attendee cannot submit feedback');
select tests.throws($$insert into public.learning_pulse_responses (workshop_id, confidence_before, confidence_after)
                      values ('11111111-0000-0000-0000-000000000001', 1, 3)$$,
  '42501', 'non-attendee cannot submit a Learning Pulse');
select tests.ok(tests.count_rows('select * from public.attendance') = 0,
  'student B cannot see student A''s attendance');
select tests.ok(tests.count_rows('select * from public.feedback') = 0,
  'student B cannot see student A''s feedback');
select tests.ok(tests.count_rows('select * from public.learning_pulse_responses') = 0,
  'student B cannot see student A''s Learning Pulse');
reset role;

-- =====================================================================
-- Resource requests (student side)
-- =====================================================================
select tests.become('a0000000-0000-0000-0000-00000000000a');
select tests.ok(tests.affected($$insert into public.resource_requests (workshop_id, topic, description)
                                 values ('11111111-0000-0000-0000-000000000001', 'SQL JOINs',
                                         'Could you share practice exercises on JOINs?')$$) = 1,
  'student can create a resource request');
select tests.ok((select status from public.resource_requests limit 1) = 'pending',
  'new requests always start as pending');
select tests.throws($$insert into public.resource_requests (workshop_id, description, status)
                      values ('11111111-0000-0000-0000-000000000001', 'Please mark this done', 'fulfilled')$$,
  '42501', 'student cannot choose the status of a new request');
select tests.ok(tests.affected($$update public.resource_requests set status = 'in_progress'$$) = 0
                and (select status from public.resource_requests limit 1) = 'pending',
  'student cannot change a request status (RLS: 0 rows updated)');
select tests.throws($$update public.resource_requests set description = 'Edited later by student'$$,
  '42501', 'student cannot edit a request after submitting it');
select tests.throws($$insert into public.resource_requests (workshop_id, description)
                      values ('11111111-0000-0000-0000-000000000001', 'short')$$,
  '23514', 'request description shorter than 10 characters is rejected');
select tests.throws($$insert into public.resource_requests (workshop_id, description)
                      values ('11111111-0000-0000-0000-000000000002', 'Request on a draft workshop')$$,
  '42501', 'student cannot create a request for a draft workshop');
reset role;

select tests.become('b0000000-0000-0000-0000-00000000000b');
select tests.ok(tests.count_rows('select * from public.resource_requests') = 0,
  'student B cannot see student A''s requests');
reset role;

-- =====================================================================
-- Organiser O1 (owns W1, W2)
-- =====================================================================
select tests.become('01000000-0000-0000-0000-000000000001');
select tests.ok(tests.count_rows('select * from public.workshops') = 3,
  'organiser sees own drafts plus published workshops');
select tests.ok(tests.count_rows('select * from public.workshop_qr_tokens') = 2,
  'organiser reads QR tokens for own workshops only');
select tests.ok(tests.count_rows($$select * from public.attendance where workshop_id = '11111111-0000-0000-0000-000000000001'$$) = 1,
  'organiser sees attendance for own workshop');
select tests.ok(tests.count_rows('select * from public.feedback') = 1,
  'organiser sees feedback for own workshop');
select tests.ok(tests.count_rows('select * from public.learning_pulse_responses') = 1,
  'organiser sees Learning Pulse for own workshop');
select tests.ok(tests.count_rows($$select * from public.profiles where id = 'a0000000-0000-0000-0000-00000000000a'$$) = 1,
  'organiser can see the name of a student who attended their workshop');
select tests.ok(tests.count_rows($$select * from public.profiles where id = 'b0000000-0000-0000-0000-00000000000b'$$) = 0,
  'organiser cannot see an unrelated student');
select tests.ok((public.check_in((select token from t_tokens where workshop_id = '11111111-0000-0000-0000-000000000001')) ->> 'status') = 'not_student',
  'organisers cannot check in as attendees');

select tests.ok(tests.affected($$insert into public.workshops (title, location, starts_at, ends_at)
                                 values ('SQL Part 2', 'Room 101', now() + interval '7 days', now() + interval '7 days 1 hour')$$) = 1,
  'organiser can create a workshop');
select tests.ok((select organiser_id from public.workshops where title = 'SQL Part 2') = '01000000-0000-0000-0000-000000000001',
  'new workshop is owned by the creating organiser');
select tests.throws($$insert into public.workshops (organiser_id, title, location, starts_at, ends_at)
                      values ('02000000-0000-0000-0000-000000000002', 'Spoofed', 'X', now(), now() + interval '1 hour')$$,
  '42501', 'organiser cannot create a workshop on behalf of another organiser');
select tests.throws($$insert into public.workshops (title, location, starts_at, ends_at)
                      values ('Backwards', 'Room 1', now(), now() - interval '1 hour')$$,
  '23514', 'workshop end time must be after start time');
select tests.ok(tests.affected($$update public.workshops set title = 'Hijacked' where id = '11111111-0000-0000-0000-000000000003'$$) = 0,
  'organiser cannot edit another organiser''s workshop');
select tests.ok(tests.affected($$delete from public.workshops where id = '11111111-0000-0000-0000-000000000001'$$) = 0,
  'published workshops cannot be deleted (cancel instead)');
select tests.ok(tests.affected($$delete from public.workshops where id = '11111111-0000-0000-0000-000000000002'$$) = 1,
  'organiser can delete own draft');
select tests.throws($$insert into public.resource_requests (workshop_id, description)
                      values ('11111111-0000-0000-0000-000000000001', 'Organiser pretending to be a student')$$,
  '42501', 'organisers cannot create student resource requests');

-- request management
select tests.ok(tests.affected($$update public.resource_requests set status = 'in_progress'$$) = 1,
  'organiser can move a request to in_progress');
select tests.throws($$update public.resource_requests set description = 'Edited by organiser'$$,
  '42501', 'organiser cannot rewrite the student''s request text');
select tests.throws($$update public.resource_requests set status = 'fulfilled'$$,
  '23514', 'a request cannot be fulfilled without a resource or note');

select tests.ok(tests.affected($$insert into public.resources (workshop_id, title, url, topic)
                                 values ('11111111-0000-0000-0000-000000000001', 'SQL JOINs explained',
                                         'https://example.org/sql-joins', 'SQL JOINs')$$) = 1,
  'organiser can share a resource on own workshop');
select tests.throws($$insert into public.resources (workshop_id, title, url)
                      values ('11111111-0000-0000-0000-000000000001', 'Insecure link', 'http://example.org')$$,
  '23514', 'resource URLs must use https');
select tests.throws($$insert into public.resources (workshop_id, title, url)
                      values ('11111111-0000-0000-0000-000000000003', 'Not my workshop', 'https://example.org')$$,
  '42501', 'organiser cannot add resources to another organiser''s workshop');
select tests.ok(tests.affected($$update public.resource_requests
                                 set status = 'fulfilled',
                                     resource_id = (select id from public.resources where title = 'SQL JOINs explained')$$) = 1,
  'organiser can fulfil a request with a resource');
select tests.ok((select fulfilled_at is not null from public.resource_requests limit 1),
  'fulfilled_at is stamped automatically');
reset role;

-- =====================================================================
-- Organiser O2 (owns W3 only) — must not see O1's student data
-- =====================================================================
select tests.become('02000000-0000-0000-0000-000000000002');
select tests.ok(tests.count_rows('select * from public.attendance') = 0,  'other organiser cannot see O1 attendance');
select tests.ok(tests.count_rows('select * from public.feedback') = 0,    'other organiser cannot see O1 feedback');
select tests.ok(tests.count_rows('select * from public.learning_pulse_responses') = 0, 'other organiser cannot see O1 Learning Pulse');
select tests.ok(tests.count_rows('select * from public.resource_requests') = 0, 'other organiser cannot see O1 requests');
select tests.ok(tests.count_rows($$select * from public.profiles where role = 'student'$$) = 0, 'other organiser cannot see O1''s students');
select tests.ok(tests.affected($$update public.resource_requests set status = 'pending'$$) = 0, 'other organiser cannot change O1 requests');
select tests.throws($$insert into public.resource_requests (workshop_id, description)
                      values ('11111111-0000-0000-0000-000000000003', 'still an organiser')$$,
  '42501', 'organiser O2 cannot create requests either');
reset role;

-- =====================================================================
-- Referential rules: same-workshop resources, protected records
-- =====================================================================
select tests.become('02000000-0000-0000-0000-000000000002');
select tests.ok(tests.affected($$insert into public.resources (workshop_id, title, url)
                                 values ('11111111-0000-0000-0000-000000000003', 'Writing guide', 'https://example.org/writing')$$) = 1,
  'organiser O2 shares a resource on their own workshop');
reset role;

-- O2's resource id, captured as admin for the next check
create temp table t_o2_resource as select id from public.resources where title = 'Writing guide';
grant select on t_o2_resource to authenticated;

select tests.become('01000000-0000-0000-0000-000000000001');
select tests.ok(tests.count_rows($$select * from public.profiles where role = 'organiser'$$) = 2,
  'organisers can read other organisers'' names');
select tests.throws(format($$update public.resource_requests set resource_id = %L$$, (select id from t_o2_resource)),
  '23503', 'a request cannot be fulfilled with a resource from another workshop');
select tests.throws($$delete from public.resources where title = 'SQL JOINs explained'$$,
  '23503', 'a resource used to fulfil a request cannot be deleted');
select tests.ok(tests.affected($$update public.resources set title = 'SQL JOINs explained (v2)' where title = 'SQL JOINs explained'$$) = 1,
  'organiser can edit their own resource');
select tests.ok(tests.affected($$update public.resources set title = 'Hijacked' where title = 'Writing guide'$$) = 0,
  'organiser cannot edit another organiser''s resource');
reset role;

-- even if a workshop with attendance is moved back to draft, it can't be deleted
update public.workshops set status = 'draft' where id = '11111111-0000-0000-0000-000000000001';
select tests.become('01000000-0000-0000-0000-000000000001');
select tests.throws($$delete from public.workshops where id = '11111111-0000-0000-0000-000000000001'$$,
  '23503', 'a workshop with attendance cannot be deleted (records are kept)');
reset role;
update public.workshops set status = 'published' where id = '11111111-0000-0000-0000-000000000001';

-- =====================================================================
-- Student A sees the loop closed
-- =====================================================================
select tests.become('a0000000-0000-0000-0000-00000000000a');
select tests.ok(
  (select r.status = 'fulfilled' and res.url = 'https://example.org/sql-joins'
   from public.resource_requests r join public.resources res on res.id = r.resource_id),
  'student sees their fulfilled request and can open the shared resource');
reset role;

select tests.ok(true, 'ALL DATABASE TESTS PASSED');
rollback;
