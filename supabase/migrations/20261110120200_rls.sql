-- =====================================================================
-- Workshop Connect+ — 3/3 Table privileges and Row Level Security
-- =====================================================================
-- Two layers, both enforced by Postgres:
--   1. GRANTs decide which COLUMNS a role may touch (e.g. students can
--      never write student_id, status, or role).
--   2. RLS POLICIES decide which ROWS a user may touch.
-- Students and organisers share the 'authenticated' Postgres role; the
-- difference is profiles.role, checked through public.is_organiser() and
-- public.owns_workshop(). The anon role gets nothing: login is required.
-- (select auth.uid()) is wrapped so Postgres evaluates it once per query.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Privileges: start from nothing, grant the minimum
-- ---------------------------------------------------------------------
revoke all on public.profiles, public.workshops, public.workshop_qr_tokens,
              public.attendance, public.feedback, public.learning_pulse_responses,
              public.resources, public.resource_requests
  from anon, authenticated;

grant select                         on public.profiles to authenticated;
grant update (full_name)             on public.profiles to authenticated;

grant select, insert, update, delete on public.workshops to authenticated;
grant select                         on public.workshop_qr_tokens to authenticated;
grant select                         on public.attendance to authenticated;

grant select                         on public.feedback to authenticated;
grant insert (workshop_id, rating, comment) on public.feedback to authenticated;

grant select                         on public.learning_pulse_responses to authenticated;
grant insert (workshop_id, confidence_before, confidence_after, support_topic)
                                     on public.learning_pulse_responses to authenticated;

grant select, insert, update, delete on public.resources to authenticated;

grant select                         on public.resource_requests to authenticated;
grant insert (workshop_id, topic, description) on public.resource_requests to authenticated;
grant update (status, resource_id, organiser_note) on public.resource_requests to authenticated;

-- ---------------------------------------------------------------------
-- 2. Enable RLS everywhere (no policy = no access)
-- ---------------------------------------------------------------------
alter table public.profiles                 enable row level security;
alter table public.workshops                enable row level security;
alter table public.workshop_qr_tokens       enable row level security;
alter table public.attendance               enable row level security;
alter table public.feedback                 enable row level security;
alter table public.learning_pulse_responses enable row level security;
alter table public.resources                enable row level security;
alter table public.resource_requests        enable row level security;

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
create policy "profiles: read own"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

-- organiser names are shown on workshop pages ("Hosted by ...")
create policy "profiles: read organisers"
  on public.profiles for select to authenticated
  using (role = 'organiser');

-- organisers see names only of students linked to THEIR workshops
create policy "profiles: organiser reads own workshop students"
  on public.profiles for select to authenticated
  using (
    public.is_organiser() and (
      exists (select 1 from public.attendance a
              join public.workshops w on w.id = a.workshop_id
              where a.student_id = profiles.id and w.organiser_id = (select auth.uid()))
      or
      exists (select 1 from public.resource_requests r
              join public.workshops w on w.id = r.workshop_id
              where r.student_id = profiles.id and w.organiser_id = (select auth.uid()))
    )
  );

-- column grant limits this to full_name
create policy "profiles: update own"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- workshops
-- ---------------------------------------------------------------------
create policy "workshops: read non-draft"
  on public.workshops for select to authenticated
  using (status <> 'draft');

create policy "workshops: organiser reads own"
  on public.workshops for select to authenticated
  using (organiser_id = (select auth.uid()));

create policy "workshops: organiser creates own"
  on public.workshops for insert to authenticated
  with check (organiser_id = (select auth.uid()) and public.is_organiser());

create policy "workshops: organiser updates own"
  on public.workshops for update to authenticated
  using (organiser_id = (select auth.uid()) and public.is_organiser())
  with check (organiser_id = (select auth.uid()) and public.is_organiser());

-- only drafts can be deleted; anything else is cancelled instead
create policy "workshops: organiser deletes own drafts"
  on public.workshops for delete to authenticated
  using (organiser_id = (select auth.uid()) and public.is_organiser() and status = 'draft');

-- ---------------------------------------------------------------------
-- workshop_qr_tokens: owner only; rows are created by trigger
-- ---------------------------------------------------------------------
create policy "qr tokens: owner reads"
  on public.workshop_qr_tokens for select to authenticated
  using (public.owns_workshop(workshop_id));

-- ---------------------------------------------------------------------
-- attendance: no insert policy — rows come only from public.check_in()
-- ---------------------------------------------------------------------
create policy "attendance: student reads own"
  on public.attendance for select to authenticated
  using (student_id = (select auth.uid()));

create policy "attendance: owner reads workshop"
  on public.attendance for select to authenticated
  using (public.owns_workshop(workshop_id));

-- ---------------------------------------------------------------------
-- feedback
-- ---------------------------------------------------------------------
create policy "feedback: student reads own"
  on public.feedback for select to authenticated
  using (student_id = (select auth.uid()));

create policy "feedback: owner reads workshop"
  on public.feedback for select to authenticated
  using (public.owns_workshop(workshop_id));

create policy "feedback: attendee submits own"
  on public.feedback for insert to authenticated
  with check (student_id = (select auth.uid()) and public.has_attended(workshop_id));

-- ---------------------------------------------------------------------
-- learning_pulse_responses
-- ---------------------------------------------------------------------
create policy "pulse: student reads own"
  on public.learning_pulse_responses for select to authenticated
  using (student_id = (select auth.uid()));

create policy "pulse: owner reads workshop"
  on public.learning_pulse_responses for select to authenticated
  using (public.owns_workshop(workshop_id));

create policy "pulse: attendee submits own"
  on public.learning_pulse_responses for insert to authenticated
  with check (student_id = (select auth.uid()) and public.has_attended(workshop_id));

-- ---------------------------------------------------------------------
-- resources
-- ---------------------------------------------------------------------
create policy "resources: read for visible workshops"
  on public.resources for select to authenticated
  using (exists (select 1 from public.workshops w
                 where w.id = resources.workshop_id and w.status <> 'draft'));

create policy "resources: owner reads"
  on public.resources for select to authenticated
  using (public.owns_workshop(workshop_id));

create policy "resources: owner creates"
  on public.resources for insert to authenticated
  with check (organiser_id = (select auth.uid()) and public.owns_workshop(workshop_id));

create policy "resources: owner updates"
  on public.resources for update to authenticated
  using (public.owns_workshop(workshop_id))
  with check (organiser_id = (select auth.uid()) and public.owns_workshop(workshop_id));

create policy "resources: owner deletes"
  on public.resources for delete to authenticated
  using (public.owns_workshop(workshop_id));

-- ---------------------------------------------------------------------
-- resource_requests
-- Students: insert own (status/resource/note not grantable, so they
-- start as defaults: pending, null, null) and read own. No update.
-- Organisers: read + update status/resource/note for own workshops.
-- ---------------------------------------------------------------------
create policy "requests: student reads own"
  on public.resource_requests for select to authenticated
  using (student_id = (select auth.uid()));

create policy "requests: student creates own"
  on public.resource_requests for insert to authenticated
  with check (
    student_id = (select auth.uid())
    and not public.is_organiser()
    and exists (select 1 from public.workshops w
                where w.id = resource_requests.workshop_id and w.status <> 'draft')
  );

create policy "requests: owner reads workshop"
  on public.resource_requests for select to authenticated
  using (public.owns_workshop(workshop_id));

create policy "requests: owner updates workshop"
  on public.resource_requests for update to authenticated
  using (public.owns_workshop(workshop_id))
  with check (public.owns_workshop(workshop_id));
