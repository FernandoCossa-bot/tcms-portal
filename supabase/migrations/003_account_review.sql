-- TCMS: review ordinary pending accounts.
-- Requires migration 001. Run the COMPLETE file once in tcms-portal.
-- 002 is the separately executed, controlled first-owner bootstrap.
-- This does not change email confirmation settings or assign module access.
begin;

create function public.core_list_pending_accounts(p_offset integer default 0)
returns table (
  user_id uuid,
  display_name text,
  email text,
  email_verified boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql security definer set search_path = ''
as $$
declare
  context jsonb;
begin
  perform 1 from public.core_system_settings where id = 1 for share;
  context := public.core_get_my_context();
  if not coalesce((context ->> 'can_enter')::boolean, false)
     or coalesce(context ->> 'platform_role', '') not in ('system_owner', 'restricted_admin') then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  if p_offset is null or p_offset < 0 or p_offset > 100000 then
    raise exception 'Invalid page offset' using errcode = '22023';
  end if;
  return query
    select p.user_id, p.display_name, u.email::text,
      u.email_confirmed_at is not null, p.created_at, p.updated_at
    from public.core_profiles p
    join auth.users u on u.id = p.user_id
    where p.account_status = 'pending'
      and p.user_id <> auth.uid()
      and not exists (
        select 1 from public.core_platform_roles r where r.user_id = p.user_id
      )
    order by p.created_at, p.user_id
    limit 21 offset p_offset;
end;
$$;
revoke all on function public.core_list_pending_accounts(integer)
  from public, anon, authenticated;
grant execute on function public.core_list_pending_accounts(integer) to authenticated;

create function public.core_review_pending_account(
  p_user_id uuid,
  p_decision text,
  p_reason text,
  p_expected_updated_at timestamptz
)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  context jsonb;
  target public.core_profiles%rowtype;
  next_status text;
  verified boolean;
begin
  -- Serialize protected writes against the global access switch.
  perform 1 from public.core_system_settings where id = 1 for share;
  context := public.core_get_my_context();
  if not coalesce((context ->> 'can_enter')::boolean, false)
     or coalesce(context ->> 'platform_role', '') not in ('system_owner', 'restricted_admin') then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  if p_user_id is null or p_user_id = auth.uid() then
    raise exception 'Cannot review your own account' using errcode = '42501';
  end if;
  if p_decision is null or p_decision not in ('approve', 'reject')
     or p_reason is null or char_length(btrim(p_reason)) not between 5 and 500
     or p_expected_updated_at is null then
    raise exception 'Provide a decision, a reason (5 to 500 characters) and the record version'
      using errcode = '22023';
  end if;
  -- Prevent a concurrent platform-role assignment during this review.
  -- Future role-management operations must retain this concurrency contract.
  lock table public.core_platform_roles in share mode;
  if exists (
    select 1 from public.core_platform_roles where user_id = p_user_id
  ) then
    raise exception 'Platform administrator accounts cannot be reviewed here'
      using errcode = '42501';
  end if;
  select * into target from public.core_profiles where user_id = p_user_id for update;
  if not found then
    raise exception 'Pending account not found' using errcode = 'P0002';
  end if;
  if target.account_status <> 'pending'
     or target.updated_at is distinct from p_expected_updated_at then
    raise exception 'Account changed. Refresh the list before reviewing.'
      using errcode = '40001';
  end if;
  select email_confirmed_at is not null into verified from auth.users where id = p_user_id;
  if p_decision = 'approve' and not coalesce(verified, false) then
    raise exception 'Email confirmation is required before approval' using errcode = '22023';
  end if;
  next_status := case when p_decision = 'approve' then 'active' else 'rejected' end;
  update public.core_profiles
  set account_status = next_status, updated_at = clock_timestamp()
  where user_id = p_user_id;
  -- Audit insert and state update succeed or fail together.
  insert into public.core_audit_events(actor_id, action, target_id, details)
  values (auth.uid(), 'account.' || p_decision, p_user_id,
    jsonb_build_object('previous_status', 'pending', 'new_status', next_status,
      'reason', btrim(p_reason)));
  return jsonb_build_object('user_id', p_user_id, 'account_status', next_status);
end;
$$;
revoke all on function public.core_review_pending_account(uuid, text, text, timestamptz)
  from public, anon, authenticated;
grant execute on function public.core_review_pending_account(uuid, text, text, timestamptz)
  to authenticated;

commit;

-- Expect two rows: anonymous_execute false, authenticated_execute true.
-- Execute permission is only the first gate: each function checks the actor.
select p.proname as function_name,
  has_function_privilege('anon', p.oid, 'EXECUTE') as anonymous_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_execute
from pg_catalog.pg_proc p
join pg_catalog.pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname in
  ('core_list_pending_accounts', 'core_review_pending_account')
order by p.proname;
