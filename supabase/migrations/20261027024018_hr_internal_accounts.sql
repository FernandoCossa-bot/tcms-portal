begin;
create table public.core_hr_access(user_id uuid primary key references public.core_profiles(user_id));
create table public.hr_employees(user_id uuid primary key references public.core_profiles(user_id), department text not null default '' check(length(department)<=120), position text not null default '' check(length(position)<=120), version integer not null default 1);
create table public.hr_account_requests(id uuid primary key,actor_id uuid not null references public.core_profiles(user_id),email text not null,display_name text not null,department text not null,position text not null,created_at timestamptz not null default now(),user_id uuid references public.core_profiles(user_id));
alter table public.core_hr_access enable row level security;
alter table public.hr_employees enable row level security;
alter table public.hr_account_requests enable row level security;
revoke all on public.core_hr_access,public.hr_employees,public.hr_account_requests from public,anon,authenticated;

create function tcms_private.hr_allowed(actor uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.core_profiles p join auth.users u on u.id=p.user_id cross join public.core_system_settings s where p.user_id=actor and s.id=1 and p.account_status='active' and not p.must_change_password and u.email_confirmed_at is not null and (s.access_enabled or exists(select 1 from public.core_platform_roles r where r.user_id=actor and r.role_code='system_owner')) and (exists(select 1 from public.core_hr_access h where h.user_id=actor) or exists(select 1 from public.core_platform_roles r where r.user_id=actor and r.role_code='system_owner')));
$$;
revoke all on function tcms_private.hr_allowed(uuid) from public,anon,authenticated;

create function public.core_hr_prepare_account(p_id uuid,p_email text,p_display_name text,p_department text,p_position text) returns jsonb language plpgsql security definer set search_path='' as $$
declare ticket public.hr_account_requests%rowtype;
begin
 perform 1 from public.core_system_settings where id=1 for share;
 if not tcms_private.hr_allowed(auth.uid()) then raise exception 'HR access required' using errcode='42501'; end if;
 perform 1 from public.core_profiles where user_id=auth.uid() for update;
 if p_id is null or p_email is null or length(p_email)>254 or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or p_display_name is null or length(btrim(p_display_name)) not between 2 and 120 or p_department is null or length(btrim(p_department)) not between 1 and 120 or p_position is null or length(btrim(p_position)) not between 1 and 120 then raise exception 'Invalid account details' using errcode='22023'; end if;
 select * into ticket from public.hr_account_requests where id=p_id;
 if found then
  if ticket.actor_id<>auth.uid() or ticket.email<>lower(btrim(p_email)) or ticket.display_name<>btrim(p_display_name) or ticket.department<>btrim(p_department) or ticket.position<>btrim(p_position) then raise exception 'Request mismatch' using errcode='22023'; end if;
  return jsonb_build_object('created',ticket.user_id is not null,'user_id',ticket.user_id);
 end if;
 if (select count(*) from public.hr_account_requests where actor_id=auth.uid() and created_at>now()-interval '1 hour')>=20 then raise exception 'Hourly creation limit reached' using errcode='22023'; end if;
 insert into public.hr_account_requests(id,actor_id,email,display_name,department,position) values(p_id,auth.uid(),lower(btrim(p_email)),btrim(p_display_name),btrim(p_department),btrim(p_position));
 return jsonb_build_object('created',false);
end $$;
revoke all on function public.core_hr_prepare_account(uuid,text,text,text,text) from public,anon,authenticated;
grant execute on function public.core_hr_prepare_account(uuid,text,text,text,text) to authenticated;

-- Auth insertion and staff/profile/audit records are one database transaction.
-- Only server-controlled app metadata can carry a provisioning ticket.
create or replace function public.core_on_user_created() returns trigger language plpgsql security definer set search_path='' as $$
declare ticket public.hr_account_requests%rowtype;
begin
 perform 1 from public.core_system_settings where id=1 for share;
 select * into ticket from public.hr_account_requests where id=(new.raw_app_meta_data->>'tcms_request_id')::uuid for update;
 if not found then raise exception 'Accounts must be created internally' using errcode='42501'; end if;
 if ticket.user_id is not null or ticket.created_at<now()-interval '15 minutes' or ticket.email<>lower(new.email) or not tcms_private.hr_allowed(ticket.actor_id) then raise exception 'Invalid provisioning request' using errcode='42501'; end if;
 insert into public.core_profiles(user_id,display_name,account_status,must_change_password) values(new.id,ticket.display_name,'active',true);
 insert into public.hr_employees(user_id,department,position) values(new.id,ticket.department,ticket.position);
 update public.hr_account_requests set user_id=new.id where id=ticket.id;
 insert into public.core_audit_events(actor_id,action,target_id,details) values(ticket.actor_id,'hr.account_created',new.id,jsonb_build_object('request_id',ticket.id,'department',ticket.department));
 return new;
end $$;

create function public.core_hr_directory(p_offset integer default 0) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not tcms_private.hr_allowed(auth.uid()) then raise exception 'HR access required' using errcode='42501'; end if;
 if p_offset is null or p_offset<0 or p_offset>100000 then raise exception 'Invalid page' using errcode='22023'; end if;
 return (select coalesce(jsonb_agg(to_jsonb(x)),'[]') from (select p.user_id,p.display_name,u.email,p.account_status,coalesce(e.department,'') department,coalesce(e.position,'') position,coalesce(e.version,0) version, (p.user_id=auth.uid() or exists(select 1 from public.core_platform_roles r where r.user_id=p.user_id) or exists(select 1 from public.core_hr_access h where h.user_id=p.user_id)) protected from public.core_profiles p join auth.users u on u.id=p.user_id left join public.hr_employees e on e.user_id=p.user_id order by p.created_at desc,p.user_id limit 21 offset p_offset) x);
end $$;
revoke all on function public.core_hr_directory(integer) from public,anon,authenticated;
grant execute on function public.core_hr_directory(integer) to authenticated;

create function public.core_hr_update_employee(p_user_id uuid,p_name text,p_department text,p_position text,p_version integer) returns jsonb language plpgsql security definer set search_path='' as $$
declare current_version integer;
begin
 perform 1 from public.core_system_settings where id=1 for share;
 lock table public.core_hr_access,public.core_platform_roles in share mode;
 if not tcms_private.hr_allowed(auth.uid()) then raise exception 'HR access required' using errcode='42501'; end if;
 if p_user_id is null or p_user_id=auth.uid() or exists(select 1 from public.core_platform_roles where user_id=p_user_id) or exists(select 1 from public.core_hr_access where user_id=p_user_id) then raise exception 'Protected account' using errcode='42501'; end if;
 if p_name is null or length(btrim(p_name)) not between 2 and 120 or p_department is null or length(btrim(p_department)) not between 1 and 120 or p_position is null or length(btrim(p_position)) not between 1 and 120 or p_version is null then raise exception 'Invalid details' using errcode='22023'; end if;
 perform 1 from public.core_profiles where user_id=p_user_id for update;
 if not found then raise exception 'Account not found' using errcode='22023'; end if;
 select version into current_version from public.hr_employees where user_id=p_user_id;
 if coalesce(current_version,0)<>p_version then raise exception 'Record changed; refresh' using errcode='40001'; end if;
 insert into public.hr_employees(user_id,department,position,version) values(p_user_id,btrim(p_department),btrim(p_position),1) on conflict(user_id) do update set department=excluded.department,position=excluded.position,version=public.hr_employees.version+1;
 update public.core_profiles set display_name=btrim(p_name),updated_at=now() where user_id=p_user_id;
 insert into public.core_audit_events(actor_id,action,target_id,details) values(auth.uid(),'hr.employee_updated',p_user_id,jsonb_build_object('department',btrim(p_department),'position',btrim(p_position)));
 return jsonb_build_object('saved',true);
end $$;
revoke all on function public.core_hr_update_employee(uuid,text,text,text,integer) from public,anon,authenticated;
grant execute on function public.core_hr_update_employee(uuid,text,text,text,integer) to authenticated;

-- Update the existing context without replacing its password/global lock checks.
do $$ declare definition text; begin
 definition:=pg_get_functiondef('public.core_get_my_context()'::regprocedure);
 definition:=replace(definition,'''user_id'',actor','''has_hr_access'',tcms_private.hr_allowed(actor),''user_id'',actor');
 if definition not like '%has_hr_access%' then raise exception 'Context definition did not match'; end if;
 execute definition;
 -- General administration belongs exclusively to the System Owner.
 definition:=pg_get_functiondef('tcms_private.dispatch(text,jsonb)'::regprocedure);
 definition:=replace(definition, 'ctx->>''platform_role'' not in (''system_owner'',''restricted_admin'')','ctx->>''platform_role'' <> ''system_owner''');
 execute definition;
 definition:=pg_get_functiondef('public.core_list_pending_accounts(integer)'::regprocedure);
 definition:=replace(definition, 'not in (''system_owner'', ''restricted_admin'')','<> ''system_owner'''); execute definition;
 definition:=pg_get_functiondef('public.core_review_pending_account(uuid,text,text,timestamptz)'::regprocedure);
 definition:=replace(definition, 'not in (''system_owner'', ''restricted_admin'')','<> ''system_owner'''); execute definition;
end $$;

do $$ declare target uuid; begin
 select id into strict target from auth.users where lower(email)='fernandocossacsm@gmail.com';
 if exists(select 1 from public.core_platform_roles where user_id=target and role_code='system_owner') then raise exception 'Owner protected'; end if;
 delete from public.core_platform_roles where user_id=target;
 insert into public.core_hr_access values(target);
 insert into public.hr_employees(user_id,department,position) values(target,'Human Resources','HR Manager') on conflict(user_id) do nothing;
 insert into public.core_module_access(user_id,role_code,overrides) values(target,'none','{}') on conflict(user_id) do update set role_code='none',overrides='{}',version=public.core_module_access.version+1,updated_at=now();
 insert into public.core_audit_events(actor_id,action,target_id,details) values('d053b3a4-72fb-484e-8a76-20a911f5875e','owner.assign_hr_remove_transport',target,'{"authorized_by":"System Owner request"}');
end $$;
commit;
