-- =====================================================================
-- Workshop Connect+ — 2/3 Functions and triggers
-- =====================================================================
-- SECURITY DEFINER functions run with the owner's rights, so each one:
--   * pins search_path to '' (prevents object-shadowing attacks)
--   * uses fully-qualified names
--   * derives the user from auth.uid(), never from a parameter
-- =====================================================================

-- ---------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at  before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger workshops_set_updated_at before update on public.workshops
  for each row execute function public.set_updated_at();
create trigger requests_set_updated_at  before update on public.resource_requests
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- New auth user -> profile. Role is ALWAYS 'student' (column default);
-- any role in sign-up metadata is ignored, so nobody can self-promote.
-- ---------------------------------------------------------------------
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    left(coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), 'Student'), 100)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Role / ownership helpers used by RLS policies.
-- SECURITY DEFINER so a policy on profiles can call them without
-- recursively re-entering profiles' own policies.
-- ---------------------------------------------------------------------
create function public.is_organiser()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'organiser'
  );
$$;

create function public.owns_workshop(p_workshop_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workshops w
    join public.profiles p on p.id = w.organiser_id
    where w.id = p_workshop_id
      and w.organiser_id = auth.uid()
      and p.role = 'organiser'
  );
$$;

-- Runs as the caller: a student can only see their own attendance anyway.
create function public.has_attended(p_workshop_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1 from public.attendance
    where workshop_id = p_workshop_id and student_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------
-- Every workshop gets a QR token automatically.
-- ---------------------------------------------------------------------
create function public.create_workshop_qr_token()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.workshop_qr_tokens (workshop_id) values (new.id);
  return new;
end;
$$;

create trigger workshops_create_qr_token
  after insert on public.workshops
  for each row execute function public.create_workshop_qr_token();

-- ---------------------------------------------------------------------
-- Request lifecycle: stamp/clear fulfilled_at automatically.
-- ---------------------------------------------------------------------
create function public.set_request_fulfilled_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'fulfilled' then
    if tg_op = 'INSERT' or old.status is distinct from 'fulfilled' then
      new.fulfilled_at := now();
    end if;
  else
    new.fulfilled_at := null;
  end if;
  return new;
end;
$$;

create trigger requests_set_fulfilled_at
  before insert or update on public.resource_requests
  for each row execute function public.set_request_fulfilled_at();

-- ---------------------------------------------------------------------
-- check_in(token): the ONLY way to create attendance.
-- Returns jsonb { status, workshop_id, workshop_title } where status is
--   checked_in | already_checked_in | invalid | closed | not_student
-- Check-in window: published workshops, from 30 min before start to
-- 60 min after end. A static QR proves possession of the link, not
-- physical presence.
-- ---------------------------------------------------------------------
create function public.check_in(p_token uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_ws  public.workshops%rowtype;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  if not exists (select 1 from public.profiles where id = v_uid and role = 'student') then
    return jsonb_build_object('status', 'not_student');
  end if;

  select w.* into v_ws
  from public.workshop_qr_tokens t
  join public.workshops w on w.id = t.workshop_id
  where t.token = p_token;

  if not found then
    return jsonb_build_object('status', 'invalid');
  end if;

  if exists (select 1 from public.attendance
             where student_id = v_uid and workshop_id = v_ws.id) then
    return jsonb_build_object('status', 'already_checked_in',
                              'workshop_id', v_ws.id, 'workshop_title', v_ws.title);
  end if;

  if v_ws.status <> 'published'
     or now() < v_ws.starts_at - interval '30 minutes'
     or now() > v_ws.ends_at   + interval '60 minutes' then
    return jsonb_build_object('status', 'closed',
                              'workshop_id', v_ws.id, 'workshop_title', v_ws.title);
  end if;

  -- ON CONFLICT covers the race where two requests arrive at once;
  -- the UNIQUE constraint is the real guarantee.
  insert into public.attendance (student_id, workshop_id)
  values (v_uid, v_ws.id)
  on conflict (student_id, workshop_id) do nothing;

  return jsonb_build_object(
    'status', case when found then 'checked_in' else 'already_checked_in' end,
    'workshop_id', v_ws.id, 'workshop_title', v_ws.title);
end;
$$;

-- ---------------------------------------------------------------------
-- promote_to_organiser(email): admin-only provisioning.
-- Not executable by anon/authenticated — run it from the Supabase SQL
-- editor (postgres role) after the person has registered normally.
-- ---------------------------------------------------------------------
create function public.promote_to_organiser(p_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles p
  set role = 'organiser'
  from auth.users u
  where u.id = p.id and lower(u.email) = lower(btrim(p_email));

  if not found then
    raise exception 'No registered user with email %', p_email;
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- Function execute privileges. Supabase grants EXECUTE on new public
-- functions to anon/authenticated by default, so revoke explicitly.
-- ---------------------------------------------------------------------
revoke execute on function public.set_updated_at()              from public, anon, authenticated;
revoke execute on function public.handle_new_user()             from public, anon, authenticated;
revoke execute on function public.create_workshop_qr_token()    from public, anon, authenticated;
revoke execute on function public.set_request_fulfilled_at()    from public, anon, authenticated;
revoke execute on function public.promote_to_organiser(text)    from public, anon, authenticated;
revoke execute on function public.check_in(uuid)                from public, anon;
revoke execute on function public.is_organiser()                from public, anon;
revoke execute on function public.owns_workshop(uuid)           from public, anon;
revoke execute on function public.has_attended(uuid)            from public, anon;

grant execute on function public.check_in(uuid)       to authenticated;
grant execute on function public.is_organiser()       to authenticated;
grant execute on function public.owns_workshop(uuid)  to authenticated;
grant execute on function public.has_attended(uuid)   to authenticated;
grant execute on function public.promote_to_organiser(text) to service_role;
