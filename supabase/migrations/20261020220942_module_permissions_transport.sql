-- TCMS only: additive installation after 001 and 003. Existing transport is untouched.
begin;
create schema tcms_private;
revoke all on schema tcms_private from public, anon, authenticated;
grant usage on schema tcms_private to authenticated;

create table public.core_module_access (
  user_id uuid primary key references public.core_profiles(user_id),
  role_code text not null default 'none' check(role_code in ('none','viewer','requester','dispatcher')),
  overrides jsonb not null default '{}' check(jsonb_typeof(overrides)='object'),
  version integer not null default 1,
  updated_at timestamptz not null default now()
);
create table public.transport_vehicles (
  id uuid primary key default gen_random_uuid(),
  registration text not null unique check(length(btrim(registration)) between 1 and 30),
  name text not null check(length(btrim(name)) between 1 and 120),
  capacity integer not null check(capacity between 1 and 100),
  mileage integer not null default 0 check(mileage >= 0),
  status text not null default 'available' check(status in ('available','maintenance','inactive')),
  version integer not null default 1,
  created_at timestamptz not null default now()
);
create table public.transport_requests (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.transport_vehicles(id),
  requester_id uuid not null references public.core_profiles(user_id),
  destination text not null check(length(btrim(destination)) between 1 and 200),
  purpose text not null check(length(btrim(purpose)) between 1 and 500),
  passengers integer not null check(passengers between 1 and 100),
  starts_at timestamptz not null,
  ends_at timestamptz not null check(ends_at > starts_at),
  status text not null default 'pending' check(status in ('pending','approved','completed','cancelled')),
  version integer not null default 1,
  created_at timestamptz not null default now()
);
create index transport_requests_vehicle_time on public.transport_requests(vehicle_id, starts_at, ends_at);
create index transport_requests_requester on public.transport_requests(requester_id, created_at desc);
alter table public.core_module_access enable row level security;
alter table public.transport_vehicles enable row level security;
alter table public.transport_requests enable row level security;
revoke all on public.core_module_access, public.transport_vehicles, public.transport_requests from public,anon,authenticated;

-- No direct table access: all writes and reads pass through checked functions.
create function tcms_private.permissions(p_user uuid)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare r text; o jsonb; result jsonb; k text;
begin
  if auth.uid() is null then raise exception 'Sign in required' using errcode='42501'; end if;
  if exists(select 1 from public.core_platform_roles where user_id=p_user and role_code='system_owner') then
    return '{"view":true,"create_request":true,"edit_request":true,"approve_request":true,"manage_fleet":true,"view_all":true}'::jsonb;
  end if;
  select role_code,overrides into r,o from public.core_module_access where user_id=p_user;
  result:=jsonb_build_object(
    'view',coalesce(r in ('viewer','requester','dispatcher'),false),
    'create_request',coalesce(r in ('requester','dispatcher'),false),
    'edit_request',coalesce(r in ('requester','dispatcher'),false),
    'approve_request',coalesce(r='dispatcher',false),
    'manage_fleet',coalesce(r='dispatcher',false),
    'view_all',coalesce(r='dispatcher',false));
  foreach k in array array['view','create_request','edit_request','approve_request','manage_fleet','view_all'] loop
    if o->>k in ('allow','deny') then result:=jsonb_set(result,array[k],to_jsonb(o->>k='allow')); end if;
  end loop;
  return result;
end $$;
revoke all on function tcms_private.permissions(uuid) from public,anon,authenticated;

-- One explicitly enumerated dispatcher; no dynamic SQL and no user-supplied identity.
-- Shared locks serialize operations against permission revocation and the global switch.
create function tcms_private.dispatch(p_action text,p_payload jsonb)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare
  ctx jsonb; perms jsonb; result jsonb; target uuid; old_access public.core_module_access%rowtype;
  new_role text; overrides jsonb; k text; reason text; target_role text;
  vehicle public.transport_vehicles%rowtype; req public.transport_requests%rowtype;
  new_id uuid; v_vehicle_id uuid; start_time timestamptz; end_time timestamptz;
  v_passengers integer; new_status text; offset_n integer;
begin
  perform 1 from public.core_system_settings where id=1 for share;
  lock table public.core_platform_roles in share mode;
  if p_action='set_permissions' then lock table public.core_module_access in exclusive mode;
  else lock table public.core_module_access in share mode; end if;
  ctx:=public.core_get_my_context();
  if not coalesce((ctx->>'can_enter')::boolean,false) then raise exception 'Access denied' using errcode='42501'; end if;
  if p_payload is null or jsonb_typeof(p_payload)<>'object' then raise exception 'Invalid payload' using errcode='22023'; end if;
  perms:=tcms_private.permissions(auth.uid());
  if p_action='my_permissions' then return perms; end if;

  if p_action in ('directory','set_permissions','audit') then
    if ctx->>'platform_role' not in ('system_owner','restricted_admin') then raise exception 'Administrator required' using errcode='42501'; end if;
    if p_action='audit' then
      if ctx->>'platform_role'<>'system_owner' then raise exception 'Owner required' using errcode='42501'; end if;
      select coalesce(jsonb_agg(to_jsonb(x)),'[]') into result from
        (select action,target_id,occurred_at,details from public.core_audit_events order by id desc limit 50) x;
      return result;
    end if;
    if p_action='directory' then
      offset_n:=coalesce((p_payload->>'offset')::integer,0);
      if offset_n not between 0 and 100000 then raise exception 'Invalid page' using errcode='22023'; end if;
      select coalesce(jsonb_agg(to_jsonb(x)),'[]') into result from (
        select p.user_id,p.display_name,p.account_status,u.email,coalesce(r.role_code,'member') as platform_role,
          coalesce(a.role_code,'none') as module_role,coalesce(a.overrides,'{}') as overrides,
          coalesce(a.version,0) as version,tcms_private.permissions(p.user_id) as effective
        from public.core_profiles p join auth.users u on u.id=p.user_id
        left join public.core_platform_roles r on r.user_id=p.user_id
        left join public.core_module_access a on a.user_id=p.user_id
        order by p.created_at,p.user_id limit 21 offset offset_n) x;
      return result;
    end if;
    target:=(p_payload->>'user_id')::uuid;
    new_role:=p_payload->>'role';
    overrides:=p_payload->'overrides';
    reason:=btrim(p_payload->>'reason');
    if target is null or new_role is null or new_role not in ('none','viewer','requester','dispatcher')
      or overrides is null or jsonb_typeof(overrides)<>'object'
      or reason is null or length(reason) not between 5 and 500
      or p_payload->>'version' is null then raise exception 'Invalid permission change' using errcode='22023'; end if;
    if target=auth.uid() then raise exception 'Cannot change your own permissions' using errcode='42501'; end if;
    select role_code into target_role from public.core_platform_roles where user_id=target;
    if target_role='system_owner' or (ctx->>'platform_role'='restricted_admin' and target_role is not null) then
      raise exception 'Protected account' using errcode='42501'; end if;
    perform 1 from public.core_profiles where user_id=target and account_status='active' for update;
    if not found then raise exception 'Active account required' using errcode='22023'; end if;
    for k in select jsonb_object_keys(overrides) loop
      if k not in ('view','create_request','edit_request','approve_request','manage_fleet','view_all')
        or overrides->>k not in ('allow','deny') or overrides->>k is null then
        raise exception 'Invalid override' using errcode='22023'; end if;
    end loop;
    select * into old_access from public.core_module_access where user_id=target;
    if coalesce(old_access.version,0)<>(p_payload->>'version')::integer then raise exception 'Refresh before saving' using errcode='40001'; end if;
    insert into public.core_module_access(user_id,role_code,overrides)
      values(target,new_role,overrides)
      on conflict(user_id) do update set role_code=excluded.role_code,overrides=excluded.overrides,
        version=public.core_module_access.version+1,updated_at=clock_timestamp();
    result:=tcms_private.permissions(target);
    if ctx->>'platform_role'='restricted_admin' then
      for k in select jsonb_object_keys(result) loop
        if (result->>k)::boolean and not (perms->>k)::boolean then
          raise exception 'Cannot delegate permissions you do not hold' using errcode='42501'; end if;
      end loop;
    end if;
    insert into public.core_audit_events(actor_id,action,target_id,details)
      values(auth.uid(),'module.permissions_changed',target,jsonb_build_object('module','transport',
        'previous',to_jsonb(old_access),'role',new_role,'overrides',overrides,'reason',reason));
    return jsonb_build_object('saved',true,'effective',result);
  end if;

  if not (perms->>'view')::boolean then raise exception 'Transport access denied' using errcode='42501'; end if;
  if p_action='vehicles' then
    select coalesce(jsonb_agg(to_jsonb(v) order by v.registration),'[]') into result from public.transport_vehicles v;
    return result;
  elsif p_action='requests' then
    offset_n:=coalesce((p_payload->>'offset')::integer,0);
    if offset_n not between 0 and 100000 then raise exception 'Invalid page' using errcode='22023'; end if;
    select coalesce(jsonb_agg(to_jsonb(x)),'[]') into result from (
      select r.*,v.registration,v.name as vehicle_name,p.display_name as requester_name
      from public.transport_requests r join public.transport_vehicles v on v.id=r.vehicle_id
      join public.core_profiles p on p.user_id=r.requester_id
      where (r.requester_id=auth.uid() or (perms->>'view_all')::boolean)
      order by r.created_at desc,r.id limit 21 offset offset_n) x;
    return result;
  elsif p_action='save_vehicle' then
    if not (perms->>'manage_fleet')::boolean then raise exception 'Fleet permission required' using errcode='42501'; end if;
    new_id:=nullif(p_payload->>'id','')::uuid;
    if new_id is not null then
      select * into vehicle from public.transport_vehicles where id=new_id for update;
      if not found then raise exception 'Vehicle unavailable' using errcode='P0002'; end if;
      if (p_payload->>'version')::integer is distinct from vehicle.version then raise exception 'Refresh before saving' using errcode='40001'; end if;
      if exists(select 1 from public.transport_requests r where r.vehicle_id=new_id
          and r.status in ('pending','approved') and r.ends_at>now()
          and (r.passengers>(p_payload->>'capacity')::integer or p_payload->>'status'<>'available')) then
        raise exception 'Vehicle has active reservations' using errcode='22023'; end if;
      update public.transport_vehicles set registration=upper(btrim(p_payload->>'registration')),
        name=btrim(p_payload->>'name'),capacity=(p_payload->>'capacity')::integer,
        mileage=(p_payload->>'mileage')::integer,status=p_payload->>'status',version=version+1 where id=new_id;
    else
      insert into public.transport_vehicles(registration,name,capacity,mileage,status)
      values(upper(btrim(p_payload->>'registration')),btrim(p_payload->>'name'),(p_payload->>'capacity')::integer,
        (p_payload->>'mileage')::integer,p_payload->>'status') returning id into new_id;
    end if;
    insert into public.core_audit_events(actor_id,action,target_id) values(auth.uid(),'transport.vehicle_saved',new_id);
    return jsonb_build_object('saved',true,'id',new_id);
  elsif p_action='save_request' then
    new_id:=nullif(p_payload->>'id','')::uuid;
    if not (perms->>(case when new_id is null then 'create_request' else 'edit_request' end))::boolean then
      raise exception 'Request permission required' using errcode='42501'; end if;
    -- Serialize reservation writes; small fleet, consistent lock order, no double bookings.
    lock table public.transport_requests in share row exclusive mode;
    if new_id is not null then
      select * into req from public.transport_requests where id=new_id for update;
      if not found or (req.requester_id<>auth.uid() and not (perms->>'view_all')::boolean) then
        raise exception 'Request unavailable' using errcode='42501'; end if;
      if (p_payload->>'version')::integer is distinct from req.version then raise exception 'Refresh before saving' using errcode='40001'; end if;
      if not (perms->>'approve_request')::boolean and req.status<>'pending' then raise exception 'Only pending requests can be edited' using errcode='42501'; end if;
      if req.status in ('completed','cancelled') then raise exception 'Closed request cannot be edited' using errcode='22023'; end if;
    end if;
    new_status:=coalesce(p_payload->>'status','pending');
    if new_id is null and new_status<>'pending' then raise exception 'New requests start pending' using errcode='22023'; end if;
    if not (perms->>'approve_request')::boolean and new_status not in ('pending','cancelled') then
      raise exception 'Approval permission required' using errcode='42501'; end if;
    v_vehicle_id:=(p_payload->>'vehicle_id')::uuid;
    start_time:=(p_payload->>'starts_at')::timestamptz;
    end_time:=(p_payload->>'ends_at')::timestamptz;
    v_passengers:=(p_payload->>'passengers')::integer;
    if start_time is null or end_time is null or end_time<=start_time or end_time>start_time+interval '30 days'
      or v_passengers is null then raise exception 'Invalid dates or passengers' using errcode='22023'; end if;
    select * into vehicle from public.transport_vehicles where id=v_vehicle_id for update;
    if not found then raise exception 'Choose an existing vehicle' using errcode='22023'; end if;
    if new_status in ('pending','approved') then
      if vehicle.status<>'available' or v_passengers>vehicle.capacity or start_time<now() then
        raise exception 'Vehicle unavailable, capacity exceeded or departure in the past' using errcode='22023'; end if;
      if exists(select 1 from public.transport_requests r where r.vehicle_id=v_vehicle_id
        and r.id is distinct from new_id and r.status in ('pending','approved')
        and r.starts_at<end_time and r.ends_at>start_time) then
        raise exception 'Vehicle is already reserved for this period' using errcode='22023'; end if;
    end if;
    if new_id is null then
      insert into public.transport_requests(vehicle_id,requester_id,destination,purpose,passengers,starts_at,ends_at,status)
      values(v_vehicle_id,auth.uid(),btrim(p_payload->>'destination'),btrim(p_payload->>'purpose'),v_passengers,start_time,end_time,new_status)
      returning id into new_id;
    else
      update public.transport_requests set vehicle_id=vehicle.id,destination=btrim(p_payload->>'destination'),
        purpose=btrim(p_payload->>'purpose'),passengers=v_passengers,starts_at=start_time,ends_at=end_time,
        status=new_status,version=version+1 where id=new_id;
    end if;
    insert into public.core_audit_events(actor_id,action,target_id,details)
      values(auth.uid(),'transport.request_saved',new_id,jsonb_build_object('status',new_status));
    return jsonb_build_object('saved',true,'id',new_id);
  end if;
  raise exception 'Unknown operation' using errcode='22023';
end $$;
revoke all on function tcms_private.dispatch(text,jsonb) from public,anon,authenticated;
grant execute on function tcms_private.dispatch(text,jsonb) to authenticated;
create function public.tcms_api(p_action text,p_payload jsonb default '{}')
returns jsonb language sql security invoker set search_path=''
as $$ select tcms_private.dispatch(p_action,p_payload); $$;
revoke all on function public.tcms_api(text,jsonb) from public,anon,authenticated;
grant execute on function public.tcms_api(text,jsonb) to authenticated;
notify pgrst,'reload schema';
commit;
