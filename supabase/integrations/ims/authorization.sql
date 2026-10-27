-- Canonical Portal identity, IMS-owned role assignments and approval workflow.
-- Apply on IMS only. Preserves legacy IMS accounts and business data.
begin;
create table if not exists public.ims_roles (
 code text primary key, name text not null, description text not null,
 legacy_role text not null, is_admin boolean not null default false,
 operations jsonb not null check(jsonb_typeof(operations)='array')
);
create table if not exists public.ims_access_requests (
 user_id uuid primary key, requester_label text not null,
 status text not null default 'pending' check(status in ('pending','approved','rejected','revoked')),
 reason text not null, requested_at timestamptz not null default now(),
 decided_by uuid, decided_at timestamptz, decision_reason text,
 version bigint not null default 1
);
create table if not exists public.ims_user_roles (
 user_id uuid primary key, role_code text not null references public.ims_roles(code),
 active boolean not null default false, assigned_by uuid not null,
 assigned_at timestamptz not null default now()
);
create table if not exists public.ims_access_events (
 id bigint generated always as identity primary key,
 actor_id uuid not null, target_id uuid not null, event text not null,
 old_role text, new_role text, reason text not null, at timestamptz not null default now()
);
alter table public.ims_roles enable row level security;
alter table public.ims_access_requests enable row level security;
alter table public.ims_user_roles enable row level security;
alter table public.ims_access_events enable row level security;
revoke all on public.ims_roles,public.ims_access_requests,public.ims_user_roles,public.ims_access_events from public,anon,authenticated,service_role;

insert into public.ims_roles(code,name,description,legacy_role,is_admin,operations) values
('viewer','Viewer','View activities, attendance, files and overview.','field_officer',false,'["access","list","attendance","files","departments","locations","projects","dashboard","file_download_check"]'),
('operator','Operator','View, create and edit activities, attendance and files; submit for review.','field_officer',false,'["access","list","attendance","files","departments","locations","projects","staff_names","dashboard","file_download_check","create","edit","activity_create","activity_edit","attendance_create","attendance_edit","file_upload_check","file_register","submit"]'),
('manager','Manager','Operator functions plus review, approval, projects and audit history.','im_team',false,'["access","list","attendance","files","departments","locations","projects","staff_names","dashboard","file_download_check","create","edit","activity_create","activity_edit","attendance_create","attendance_edit","file_upload_check","file_register","submit","verify","approve","return","project_save","audit"]'),
('administrator','Administrator','Manage IMS access and operations, including archive and restore.','im_team',true,'["access","list","attendance","files","departments","locations","projects","staff_names","dashboard","file_download_check","create","edit","activity_create","activity_edit","attendance_create","attendance_edit","file_upload_check","file_register","submit","verify","approve","return","project_save","audit","reopen","activity_archive","activity_restore","attendance_archive","attendance_restore","file_archive","file_restore","archived_activities","archived_attendance","archived_files","department_save","location_save","staff"]')
on conflict(code) do update set name=excluded.name,description=excluded.description,legacy_role=excluded.legacy_role,is_admin=excluded.is_admin,operations=excluded.operations;

-- Preserve the already approved Owner access, now keyed by the Portal Auth UUID.
insert into public.ims_user_roles(user_id,role_code,active,assigned_by)
select i.portal_id,'administrator',true,i.portal_id from ims_portal_private.identities i
join public.staff_profiles p on p.id=i.local_id
where i.portal_id='d053b3a4-72fb-484e-8a76-20a911f5875e' and i.enabled and p.approved and p.is_admin
on conflict(user_id) do nothing;
insert into public.ims_access_requests(user_id,requester_label,status,reason,decided_by,decided_at,decision_reason)
select i.portal_id,coalesce(nullif(p.display_name,''),'Portal System Owner'),'approved','Previously authorized Owner integration',i.portal_id,now(),'Preserved existing approved access'
from ims_portal_private.identities i join public.staff_profiles p on p.id=i.local_id
where i.portal_id='d053b3a4-72fb-484e-8a76-20a911f5875e' and i.enabled and p.approved and p.is_admin
on conflict(user_id) do nothing;

create or replace function public.ims_portal_access(p_actor uuid,p_action text,p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,pg_temp
as $$ declare role_row public.ims_roles%rowtype; req public.ims_access_requests%rowtype;
 target uuid; next_status text; next_role text; old_role text; result jsonb; note text;
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'Server access required' using errcode='42501'; end if;
 select r.* into role_row from public.ims_user_roles ur join public.ims_roles r on r.code=ur.role_code where ur.user_id=p_actor and ur.active;
 if p_action='access' then
  select * into req from public.ims_access_requests where user_id=p_actor;
  return jsonb_build_object('allowed',role_row.code is not null,'status',coalesce(req.status,'none'),'role_code',role_row.code,'role',role_row.legacy_role,'is_admin',coalesce(role_row.is_admin,false),'operations',coalesce(role_row.operations,'[]'::jsonb),'local_id',p_actor,'user_id',p_actor);
 end if;
 if p_action='request_access' then
  note=btrim(coalesce(p_payload->>'reason',''));
  if length(note) not between 5 and 500 then raise exception 'A reason of 5 to 500 characters is required'; end if;
  insert into public.ims_access_requests(user_id,requester_label,reason)
  values(p_actor,left(coalesce(nullif(p_payload->>'verified_label',''),p_actor::text),200),note)
  on conflict(user_id) do nothing;
  select * into req from public.ims_access_requests where user_id=p_actor for update;
  if req.status in ('rejected','revoked') then
   update public.ims_access_requests set status='pending',reason=note,requested_at=now(),decided_by=null,decided_at=null,decision_reason=null,version=version+1 where user_id=p_actor;
  end if;
  if not exists(select 1 from public.ims_access_events where target_id=p_actor and event='requested' and at>=req.requested_at) or req.status in ('rejected','revoked') then
   insert into public.ims_access_events(actor_id,target_id,event,reason) values(p_actor,p_actor,'requested',note);
  end if;
  return jsonb_build_object('status',case when req.status='approved' then 'approved' else 'pending' end);
 end if;
 if not coalesce(role_row.is_admin,false) then raise exception 'IMS administrator required' using errcode='42501'; end if;
 if p_action='access_roles' then
  select coalesce(jsonb_agg(jsonb_build_object('code',code,'name',name,'description',description) order by code),'[]') into result from public.ims_roles;return result;
 elsif p_action='access_queue' then
  select coalesce(jsonb_agg(to_jsonb(t)),'[]') into result from (
   select q.*,ur.role_code,coalesce(ur.active,false) active from public.ims_access_requests q left join public.ims_user_roles ur on ur.user_id=q.user_id order by (q.status='pending') desc,q.requested_at desc limit 200
  ) t;return result;
 elsif p_action='access_history' then
  select coalesce(jsonb_agg(to_jsonb(t)),'[]') into result from(select * from public.ims_access_events order by id desc limit 200)t;return result;
 elsif p_action='access_decide' then
  target=(p_payload->>'user_id')::uuid;next_status=p_payload->>'status';next_role=p_payload->>'role_code';note=btrim(coalesce(p_payload->>'reason',''));
  if target=p_actor or target='d053b3a4-72fb-484e-8a76-20a911f5875e' then raise exception 'Protected account' using errcode='42501'; end if;
  if next_status not in ('approved','rejected','revoked') or next_status is null or length(note) not between 5 and 500 then raise exception 'Invalid decision'; end if;
  select * into req from public.ims_access_requests where user_id=target for update;
  if not found then raise exception 'Access request not found'; end if;
  if req.version is distinct from (p_payload->>'version')::bigint then raise exception 'Request changed; refresh before deciding' using errcode='40001'; end if;
  select role_code into old_role from public.ims_user_roles where user_id=target;
  if next_status='approved' then
   if not exists(select 1 from public.ims_roles where code=next_role) then raise exception 'Choose an IMS role'; end if;
   insert into public.ims_user_roles(user_id,role_code,active,assigned_by) values(target,next_role,true,p_actor)
   on conflict(user_id) do update set role_code=excluded.role_code,active=true,assigned_by=p_actor,assigned_at=now();
  else
   update public.ims_user_roles set active=false,assigned_by=p_actor,assigned_at=now() where user_id=target;
  end if;
  update public.ims_access_requests set status=next_status,decided_by=p_actor,decided_at=now(),decision_reason=note,version=version+1 where user_id=target;
  insert into public.ims_access_events(actor_id,target_id,event,old_role,new_role,reason) values(p_actor,target,next_status,old_role,case when next_status='approved' then next_role else null end,note);
  return jsonb_build_object('status',next_status,'role_code',case when next_status='approved' then next_role else null end);
 end if;
 raise exception 'Unsupported access operation';
end $$;
revoke all on function public.ims_portal_access(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.ims_portal_access(uuid,text,jsonb) to service_role;

-- Legacy entry points keep their existing behavior. Gateway calls explicitly use
-- the canonical Portal UUID and IMS role table; no additional Auth account exists.
create or replace function public.is_approved_staff() returns boolean language sql stable security definer set search_path=pg_catalog,public,pg_temp as $$
 select case when current_setting('request.tcms.portal',true)='true' then exists(select 1 from public.ims_user_roles where user_id=auth.uid() and active)
 else exists(select 1 from public.staff_profiles where id=auth.uid() and approved) end;
$$;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=pg_catalog,public,pg_temp as $$
 select case when current_setting('request.tcms.portal',true)='true' then exists(select 1 from public.ims_user_roles ur join public.ims_roles r on r.code=ur.role_code where ur.user_id=auth.uid() and ur.active and r.is_admin)
 else exists(select 1 from public.staff_profiles where id=auth.uid() and approved and is_admin) end;
$$;
create or replace function public.has_role(p_roles text[]) returns boolean language sql stable security definer set search_path=pg_catalog,public,pg_temp as $$
 select case when current_setting('request.tcms.portal',true)='true' then exists(select 1 from public.ims_user_roles ur join public.ims_roles r on r.code=ur.role_code where ur.user_id=auth.uid() and ur.active and (r.is_admin or r.legacy_role=any(p_roles)))
 else exists(select 1 from public.staff_profiles where id=auth.uid() and approved and (is_admin or role=any(p_roles))) end;
$$;
create or replace function public.staff_name(p_id uuid) returns text language sql stable security definer set search_path=pg_catalog,public,pg_temp as $$
 select case when p_id is null or not public.is_approved_staff() then null else coalesce(
 (select coalesce(nullif(display_name,''),email) from public.staff_profiles where id=p_id),
 (select requester_label from public.ims_access_requests where user_id=p_id),p_id::text) end;
$$;
create or replace function public.ims_portal_dispatch(p_portal_id uuid,p_action text,p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,pg_temp
as $$ declare actor uuid; result jsonb; permissions jsonb; role_code text; legacy_role text; admin boolean; begin
 -- This interface is callable only by the server function, after Portal validation.
 if coalesce(auth.role(),'') <> 'service_role' then raise exception 'Server access required' using errcode='42501'; end if;
 actor=p_portal_id;
 select r.operations,r.code,r.legacy_role,r.is_admin into permissions,role_code,legacy_role,admin from public.ims_user_roles ur join public.ims_roles r on r.code=ur.role_code where ur.user_id=actor and ur.active;
 if permissions is null then
  if p_action='access' then return jsonb_build_object('allowed',false); end if;
  raise exception 'IMS access not approved' using errcode='42501';
 end if;
 if not permissions ? p_action then raise exception 'Operation not permitted for this IMS role' using errcode='42501'; end if;
 perform set_config('request.tcms.portal','true',true);
 perform set_config('request.jwt.claim.sub',actor::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true);
 case p_action
 when 'access' then return jsonb_build_object('allowed',true,'role',legacy_role,'role_code',role_code,'is_admin',admin,'local_id',actor,'user_id',actor,'operations',permissions);
 when 'list' then select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) into result from public.get_training_sessions() t;
 when 'create' then select to_jsonb(public.add_training_session(
   p_payload->>'name',(p_payload->>'date')::date,p_payload->>'location')) into result;
 when 'edit' then
   -- Preserve all optional fields not exposed in the Portal form.
   select to_jsonb(public.update_training_session(s.id,p_payload->>'name',
    (p_payload->>'date')::date,p_payload->>'location',s.activity_type,s.department_id,
    s.project_id,s.location_id,s.planned_participants,s.objectives,s.results)) into result
   from public.training_sessions s where s.id=(p_payload->>'id')::bigint;
   if result is null then raise exception 'Activity not found'; end if;
 when 'attendance' then select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) into result from public.get_session_attendance(nullif(p_payload->>'id','')::bigint) t;
 when 'attendance_create' then select to_jsonb(public.add_attendance_record(nullif(p_payload->>'session_id','')::bigint,p_payload->>'name',p_payload->>'status')) into result;
 when 'attendance_edit' then select to_jsonb(public.update_attendance_record(nullif(p_payload->>'id','')::bigint,p_payload->>'name',p_payload->>'status')) into result;
 when 'files' then select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) into result from public.get_session_files(nullif(p_payload->>'id','')::bigint) t;
 when 'departments' then select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) into result from public.get_departments() t;
 when 'locations' then select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) into result from public.get_locations() t;
 when 'projects' then select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) into result from public.get_projects() t;
 when 'staff_names' then select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) into result from public.get_staff_names() t;
 when 'staff' then select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) into result from public.get_staff_admin() t;
 when 'audit' then select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) into result from public.get_audit_log() t;
 when 'dashboard' then select to_jsonb(public.get_dashboard(nullif(p_payload->>'from','')::date,nullif(p_payload->>'to','')::date,nullif(p_payload->>'department_id','')::bigint)) into result;
 when 'submit' then select to_jsonb(public.submit_activity(nullif(p_payload->>'id','')::bigint)) into result;
 when 'verify' then select to_jsonb(public.verify_activity(nullif(p_payload->>'id','')::bigint)) into result;
 when 'approve' then select to_jsonb(public.approve_activity(nullif(p_payload->>'id','')::bigint)) into result;
 when 'return' then select to_jsonb(public.return_activity(nullif(p_payload->>'id','')::bigint,p_payload->>'note')) into result;
 when 'reopen' then select to_jsonb(public.reopen_activity(nullif(p_payload->>'id','')::bigint,p_payload->>'note')) into result;
 when 'activity_archive' then select to_jsonb(public.archive_training_session(nullif(p_payload->>'id','')::bigint)) into result;
 when 'activity_restore' then select to_jsonb(public.restore_training_session(nullif(p_payload->>'id','')::bigint)) into result;
 when 'attendance_archive' then select to_jsonb(public.archive_attendance_record(nullif(p_payload->>'id','')::bigint)) into result;
 when 'attendance_restore' then select to_jsonb(public.restore_attendance_record(nullif(p_payload->>'id','')::bigint)) into result;
 when 'file_archive' then select to_jsonb(public.archive_session_file(nullif(p_payload->>'id','')::bigint)) into result;
 when 'file_restore' then select to_jsonb(public.restore_session_file(nullif(p_payload->>'id','')::bigint)) into result;
 when 'archived_activities' then select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) into result from public.get_archived_sessions() t;
 when 'archived_attendance' then select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) into result from public.get_archived_attendance() t;
 when 'archived_files' then select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) into result from public.get_archived_files() t;
 when 'department_save' then select to_jsonb(public.save_department(nullif(p_payload->>'id','')::bigint,p_payload->>'code',p_payload->>'name_pt',p_payload->>'name_en',p_payload->>'name_zh',nullif(p_payload->>'active','')::boolean)) into result;
 when 'location_save' then select to_jsonb(public.save_location(nullif(p_payload->>'id','')::bigint,p_payload->>'name',p_payload->>'level',nullif(p_payload->>'parent_id','')::bigint,nullif(p_payload->>'active','')::boolean)) into result;
 when 'project_save' then select to_jsonb(public.save_project(nullif(p_payload->>'id','')::bigint,p_payload->>'code',p_payload->>'name',nullif(p_payload->>'department_id','')::bigint,nullif(p_payload->>'location_id','')::bigint,nullif(p_payload->>'start_date','')::date,nullif(p_payload->>'end_date','')::date,nullif(p_payload->>'budget','')::numeric,p_payload->>'status',nullif(p_payload->>'responsible_id','')::uuid,p_payload->>'description')) into result;
 when 'staff_save' then select to_jsonb(public.save_staff_profile(nullif(p_payload->>'id','')::uuid,nullif(p_payload->>'approved','')::boolean,p_payload->>'role',nullif(p_payload->>'department_id','')::bigint,nullif(p_payload->>'is_admin','')::boolean)) into result;
 when 'activity_create' then select to_jsonb(public.add_training_session(p_payload->>'name',nullif(p_payload->>'date','')::date,p_payload->>'location',p_payload->>'activity_type',nullif(p_payload->>'department_id','')::bigint,nullif(p_payload->>'project_id','')::bigint,nullif(p_payload->>'location_id','')::bigint,nullif(p_payload->>'planned_participants','')::integer,p_payload->>'objectives',p_payload->>'results')) into result;
 when 'activity_edit' then select to_jsonb(public.update_training_session(nullif(p_payload->>'id','')::bigint,p_payload->>'name',nullif(p_payload->>'date','')::date,p_payload->>'location',p_payload->>'activity_type',nullif(p_payload->>'department_id','')::bigint,nullif(p_payload->>'project_id','')::bigint,nullif(p_payload->>'location_id','')::bigint,nullif(p_payload->>'planned_participants','')::integer,p_payload->>'objectives',p_payload->>'results')) into result;
 when 'file_upload_check' then
 if not exists(select 1 from public.training_sessions where id=(p_payload->>'id')::bigint and archived_at is null) then raise exception 'Activity unavailable'; end if;
 return jsonb_build_object('allowed',true);
 when 'file_register' then
 if p_payload->>'path' not like 'session-' || (p_payload->>'id') || '/portal-' || actor::text || '/%' then raise exception 'Invalid upload owner' using errcode='42501'; end if;
 select to_jsonb(public.add_session_file((p_payload->>'id')::bigint,p_payload->>'path',p_payload->>'name',p_payload->>'mime',(p_payload->>'size')::bigint,p_payload->>'caption')) into result;
 when 'file_download_check' then
 select jsonb_build_object('path',f.storage_path,'name',f.file_name) into result from public.session_files f join public.training_sessions s on s.id=f.training_session_id where f.id=(p_payload->>'id')::bigint and f.archived_at is null and s.archived_at is null;
 if result is null then raise exception 'File unavailable'; end if;
 else raise exception 'Unsupported operation' using errcode='22023';
 end case;
 return result;
end $$;
revoke all on function public.ims_portal_dispatch(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.ims_portal_dispatch(uuid,text,jsonb) to service_role;

commit;
