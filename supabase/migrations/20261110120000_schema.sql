-- =====================================================================
-- Workshop Connect+ — 1/3 Schema: types, tables, constraints, indexes
-- =====================================================================
-- Conventions
--   * uuid primary keys (gen_random_uuid is built into Postgres 13+)
--   * every timestamp is timestamptz (stored in UTC, displayed Europe/London)
--   * student-owned rows default student_id to auth.uid(), so the client
--     never supplies a student id (see grants in migration 3)
-- =====================================================================

create type public.user_role       as enum ('student', 'organiser');
create type public.workshop_status as enum ('draft', 'published', 'completed', 'cancelled');
create type public.request_status  as enum ('pending', 'in_progress', 'fulfilled');

-- ---------------------------------------------------------------------
-- profiles: one row per auth user. Credentials live in auth.users only.
-- ---------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null check (char_length(btrim(full_name)) between 1 and 100),
  role        public.user_role not null default 'student',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- workshops
-- ---------------------------------------------------------------------
create table public.workshops (
  id            uuid primary key default gen_random_uuid(),
  organiser_id  uuid not null default auth.uid()
                references public.profiles (id) on delete restrict,
  title         text not null check (char_length(btrim(title)) between 3 and 120),
  description   text not null default '' check (char_length(description) <= 2000),
  starts_at     timestamptz not null,
  ends_at       timestamptz not null,
  location      text not null check (char_length(btrim(location)) between 2 and 120),
  -- optional organiser-defined topics; students pick from these in the Learning Pulse
  focus_topics  text[] not null default '{}' check (cardinality(focus_topics) <= 8),
  status        public.workshop_status not null default 'draft',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint workshops_time_order check (ends_at > starts_at)
);

create index workshops_organiser_starts_idx on public.workshops (organiser_id, starts_at);
create index workshops_status_starts_idx    on public.workshops (status, starts_at);

-- ---------------------------------------------------------------------
-- workshop_qr_tokens: kept apart from workshops so students, who can read
-- workshops, can never read check-in tokens (RLS cannot hide one column
-- from one role while showing it to another).
-- ---------------------------------------------------------------------
create table public.workshop_qr_tokens (
  workshop_id  uuid primary key references public.workshops (id) on delete cascade,
  token        uuid not null unique default gen_random_uuid(),
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- attendance: inserted only by public.check_in() (migration 2)
-- ---------------------------------------------------------------------
create table public.attendance (
  id             uuid primary key default gen_random_uuid(),
  student_id     uuid not null references public.profiles (id) on delete cascade,
  workshop_id    uuid not null references public.workshops (id) on delete restrict,
  checked_in_at  timestamptz not null default now(),
  constraint attendance_student_workshop_unique unique (student_id, workshop_id)
);

create index attendance_workshop_idx on public.attendance (workshop_id);

-- ---------------------------------------------------------------------
-- feedback: one per student per workshop, attendees only (RLS)
-- ---------------------------------------------------------------------
create table public.feedback (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null default auth.uid()
               references public.profiles (id) on delete cascade,
  workshop_id  uuid not null references public.workshops (id) on delete restrict,
  rating       smallint not null check (rating between 1 and 5),
  comment      text check (comment is null or char_length(comment) <= 1000),
  created_at   timestamptz not null default now(),
  constraint feedback_student_workshop_unique unique (student_id, workshop_id)
);

create index feedback_workshop_idx on public.feedback (workshop_id);

-- ---------------------------------------------------------------------
-- learning_pulse_responses: retrospective self-reported confidence.
-- confidence_change is a subjective indicator, not a measure of learning.
-- ---------------------------------------------------------------------
create table public.learning_pulse_responses (
  id                 uuid primary key default gen_random_uuid(),
  student_id         uuid not null default auth.uid()
                     references public.profiles (id) on delete cascade,
  workshop_id        uuid not null references public.workshops (id) on delete restrict,
  confidence_before  smallint not null check (confidence_before between 1 and 5),
  confidence_after   smallint not null check (confidence_after between 1 and 5),
  confidence_change  smallint generated always as (confidence_after - confidence_before) stored,
  support_topic      text check (support_topic is null or char_length(btrim(support_topic)) between 1 and 80),
  created_at         timestamptz not null default now(),
  constraint pulse_student_workshop_unique unique (student_id, workshop_id)
);

create index pulse_workshop_idx on public.learning_pulse_responses (workshop_id);

-- ---------------------------------------------------------------------
-- resources: learning links shared by organisers (non-personal content)
-- ---------------------------------------------------------------------
create table public.resources (
  id            uuid primary key default gen_random_uuid(),
  workshop_id   uuid not null references public.workshops (id) on delete cascade,
  organiser_id  uuid not null default auth.uid()
                references public.profiles (id) on delete restrict,
  title         text not null check (char_length(btrim(title)) between 3 and 120),
  url           text not null check (url ~* '^https://[^[:space:]]+$' and char_length(url) <= 2000),
  topic         text check (topic is null or char_length(btrim(topic)) between 1 and 80),
  created_at    timestamptz not null default now(),
  -- lets resource_requests reference (resource, workshop) so a request can
  -- only be fulfilled with a resource from the same workshop
  constraint resources_id_workshop_unique unique (id, workshop_id)
);

create index resources_workshop_idx on public.resources (workshop_id);

-- ---------------------------------------------------------------------
-- resource_requests: PENDING -> IN_PROGRESS -> FULFILLED
-- ---------------------------------------------------------------------
create table public.resource_requests (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null default auth.uid()
                  references public.profiles (id) on delete cascade,
  workshop_id     uuid not null references public.workshops (id) on delete restrict,
  topic           text check (topic is null or char_length(btrim(topic)) between 1 and 80),
  description     text not null check (char_length(btrim(description)) between 10 and 1000),
  status          public.request_status not null default 'pending',
  resource_id     uuid,
  organiser_note  text check (organiser_note is null or char_length(organiser_note) <= 500),
  fulfilled_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint requests_resource_same_workshop
    foreign key (resource_id, workshop_id)
    references public.resources (id, workshop_id) on delete restrict,
  -- a fulfilled request must give the student something: a link or a note
  constraint requests_fulfilled_has_response
    check (status <> 'fulfilled' or resource_id is not null or organiser_note is not null)
);

create index requests_workshop_status_idx on public.resource_requests (workshop_id, status);
create index requests_student_idx         on public.resource_requests (student_id);
