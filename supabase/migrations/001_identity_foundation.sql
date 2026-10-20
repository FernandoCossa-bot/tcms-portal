-- TCMS identity foundation. Run once, in the NEW tcms-portal project only.
-- This migration does not modify the existing transport project.
-- Execute the complete file as one transaction. Do not run selected fragments.
-- Existing objects cause a safe failure rather than being overwritten.
begin;

create table public.core_profiles (
  user_id uuid primary key references auth.users(id) on delete restrict,
  display_name text not null default ''
    check (char_length(display_name) <= 120),
  account_status text not null default 'pending'
    check (account_status in ('pending', 'active', 'rejected', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.core_platform_roles (
  user_id uuid primary key references public.core_profiles(user_id) on delete restrict,
  role_code text not null check (role_code in ('system_owner', 'restricted_admin')),
  created_at timestamptz not null default now()
);

create table public.core_system_settings (
  id integer primary key default 1 check (id = 1),
  access_enabled boolean not null default true,
  version bigint not null default 1,
  updated_at timestamptz not null default now()
);
insert into public.core_system_settings(id) values (1);

create table public.core_audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null,
  target_id uuid,
  details jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

alter table public.core_profiles enable row level security;
alter table public.core_platform_roles enable row level security;
alter table public.core_system_settings enable row level security;
alter table public.core_audit_events enable row level security;

-- Default-deny RLS: no direct browser table access in this first migration.
-- RPCs below check identity explicitly before using their elevated privileges.
revoke all on table public.core_profiles, public.core_platform_roles,
  public.core_system_settings, public.core_audit_events
  from public, anon, authenticated;
revoke all on sequence public.core_audit_events_id_seq
  from public, anon, authenticated;

-- User metadata supplies only display text, NEVER approval or permissions.
create function public.core_on_user_created()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.core_profiles(user_id, display_name)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'display_name', ''), 120));
  return new;
end;
$$;
revoke all on function public.core_on_user_created() from public, anon, authenticated;

create trigger core_user_created
after insert on auth.users
for each row execute function public.core_on_user_created();

-- Existing Auth identities, if any, also start pending, never as owners.
insert into public.core_profiles(user_id, display_name)
select id, left(coalesce(raw_user_meta_data ->> 'display_name', ''), 120)
from auth.users
on conflict (user_id) do nothing;

-- Onboarding exception: a signed-in user can inspect only their own status,
-- even when pending or globally blocked. No directory or business data is exposed.
create function public.core_get_my_context()
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  profile public.core_profiles%rowtype;
  platform_role text;
  verified boolean;
  enabled boolean;
begin
  if actor is null then
    raise exception 'Sign-in required' using errcode = '42501';
  end if;
  select * into profile from public.core_profiles where user_id = actor;
  if not found then
    raise exception 'Account profile unavailable' using errcode = '42501';
  end if;
  select role_code into platform_role from public.core_platform_roles where user_id = actor;
  select email_confirmed_at is not null into verified from auth.users where id = actor;
  select access_enabled into enabled from public.core_system_settings where id = 1;
  return jsonb_build_object(
    'user_id', actor,
    'display_name', profile.display_name,
    'account_status', profile.account_status,
    'platform_role', coalesce(platform_role, 'member'),
    'email_verified', coalesce(verified, false),
    'access_enabled', coalesce(enabled, false),
    'can_enter', profile.account_status = 'active'
      and coalesce(verified, false)
      and (coalesce(enabled, false) or platform_role is not distinct from 'system_owner')
  );
end;
$$;
revoke all on function public.core_get_my_context() from public, anon, authenticated;
grant execute on function public.core_get_my_context() to authenticated;

-- First safe update RPC: users can edit their own display name, not their role.
create function public.core_update_my_display_name(p_display_name text)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  context jsonb;
begin
  -- Shared lock serializes this write against the global access switch.
  perform 1 from public.core_system_settings where id = 1 for share;
  context := public.core_get_my_context();
  if not coalesce((context ->> 'can_enter')::boolean, false) then
    raise exception 'Access denied' using errcode = '42501';
  end if;
  if p_display_name is null or char_length(btrim(p_display_name)) not between 1 and 120 then
    raise exception 'Display name must contain 1 to 120 characters' using errcode = '22023';
  end if;
  update public.core_profiles
  set display_name = btrim(p_display_name), updated_at = now()
  where user_id = auth.uid();
  insert into public.core_audit_events(actor_id, action, target_id)
  values (auth.uid(), 'profile.display_name_changed', auth.uid());
  return public.core_get_my_context();
end;
$$;
revoke all on function public.core_update_my_display_name(text) from public, anon, authenticated;
grant execute on function public.core_update_my_display_name(text) to authenticated;

-- Only a verified, active owner may read/write the switch.
create function public.core_get_access_control()
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  context jsonb := public.core_get_my_context();
  result jsonb;
begin
  if context ->> 'platform_role' <> 'system_owner'
     or not coalesce((context ->> 'can_enter')::boolean, false) then
    raise exception 'System Owner access required' using errcode = '42501';
  end if;
  select jsonb_build_object('access_enabled', access_enabled, 'version', version)
  into result from public.core_system_settings where id = 1;
  return result;
end;
$$;
revoke all on function public.core_get_access_control() from public, anon, authenticated;
grant execute on function public.core_get_access_control() to authenticated;

create function public.core_set_global_access(
  p_enabled boolean, p_expected_version bigint, p_reason text
)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  current_settings public.core_system_settings%rowtype;
begin
  select * into current_settings from public.core_system_settings where id = 1 for update;
  perform public.core_get_access_control();
  if p_enabled is null or p_expected_version is null
     or p_reason is null or char_length(btrim(p_reason)) not between 5 and 500 then
    raise exception 'Provide a state, version and reason (5 to 500 characters)' using errcode = '22023';
  end if;
  if current_settings.version <> p_expected_version then
    raise exception 'Settings changed. Refresh and try again.' using errcode = '40001';
  end if;
  update public.core_system_settings
  set access_enabled = p_enabled, version = version + 1, updated_at = now()
  where id = 1;
  insert into public.core_audit_events(actor_id, action, details)
  values (auth.uid(), 'system.access_changed', jsonb_build_object(
    'previous', current_settings.access_enabled,
    'enabled', p_enabled, 'reason', btrim(p_reason)));
  return public.core_get_access_control();
end;
$$;
revoke all on function public.core_set_global_access(boolean, bigint, text)
  from public, anon, authenticated;
grant execute on function public.core_set_global_access(boolean, bigint, text)
  to authenticated;

commit;

-- Installation report: expect four rows, RLS true, direct browser access false.
select c.relname as table_name, c.relrowsecurity as rls_enabled,
  has_table_privilege('anon', c.oid, 'SELECT') as anon_read,
  has_table_privilege('authenticated', c.oid, 'INSERT') as direct_insert,
  has_table_privilege('authenticated', c.oid, 'UPDATE') as direct_update
from pg_catalog.pg_class c
join pg_catalog.pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('core_profiles', 'core_platform_roles',
    'core_system_settings', 'core_audit_events')
order by c.relname;
