-- Additive IMS integration. No business rows or existing account roles replaced.
begin;
create schema if not exists ims_portal_private;
revoke all on schema ims_portal_private from public,anon,authenticated;
create table if not exists ims_portal_private.identities (
 portal_id uuid primary key,
 local_id uuid not null unique references public.staff_profiles(id),
 enabled boolean not null default false,
 created_at timestamptz not null default now()
);
alter table ims_portal_private.identities enable row level security;
revoke all on ims_portal_private.identities from public,anon,authenticated;

create or replace function public.ims_portal_dispatch(p_portal_id uuid,p_action text,p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,pg_temp
as $$ declare actor uuid; result jsonb; begin
 -- This interface is callable only by the server function, after Portal validation.
 if coalesce(auth.role(),'') <> 'service_role' then raise exception 'Server access required' using errcode='42501'; end if;
 select local_id into actor from ims_portal_private.identities where portal_id=p_portal_id and enabled;
 if actor is null then
  if p_action='access' then return jsonb_build_object('allowed',false,'reason','not_assigned'); end if;
  raise exception 'IMS access not assigned' using errcode='42501';
 end if;
 perform set_config('request.jwt.claim.sub',actor::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true);
 if not public.is_approved_staff() then
  if p_action='access' then return jsonb_build_object('allowed',false,'reason','not_approved'); end if;
  raise exception 'IMS access not approved' using errcode='42501';
 end if;
 case p_action
 when 'access' then return jsonb_build_object('allowed',true,'role',(select role from public.staff_profiles where id=actor),'is_admin',public.is_admin(),'local_id',actor);
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
create or replace function public.ims_portal_owner_setup(p_local_id uuid default null)
returns uuid language plpgsql security definer set search_path=pg_catalog,public,pg_temp
as $$ declare found_id uuid; begin
 if coalesce(auth.role(),'') <> 'service_role' then raise exception 'Server access required'; end if;
 select local_id into found_id from ims_portal_private.identities where portal_id='d053b3a4-72fb-484e-8a76-20a911f5875e';
 if found_id is not null then return found_id; end if;
 if p_local_id is null then return null; end if;
 if not exists(select 1 from auth.users where id=p_local_id and email='portal-owner-d053b3a4@tcms.example.invalid') then raise exception 'Invalid local identity'; end if;
 update public.staff_profiles set approved=true,is_admin=true,role='im_team' where id=p_local_id;
 if not found then raise exception 'Profile missing'; end if;
 insert into ims_portal_private.identities(portal_id,local_id,enabled)
 values('d053b3a4-72fb-484e-8a76-20a911f5875e',p_local_id,true);
 return p_local_id;
end $$;
revoke all on function public.ims_portal_owner_setup(uuid) from public,anon,authenticated;
grant execute on function public.ims_portal_owner_setup(uuid) to service_role;
create or replace function ims_portal_private.protect_owner()
returns trigger language plpgsql security definer set search_path=pg_catalog,public,pg_temp
as $$ begin
 if exists(select 1 from ims_portal_private.identities where portal_id='d053b3a4-72fb-484e-8a76-20a911f5875e' and local_id=old.id) then
  if TG_OP='DELETE' then raise exception 'Protected Portal Owner'; end if;
  if new.approved is distinct from true or new.is_admin is distinct from true or new.id is distinct from old.id or new.role is distinct from old.role then raise exception 'Protected Portal Owner'; end if;
 end if;
 if TG_OP='DELETE' then return old; end if; return new;
end $$;
revoke all on function ims_portal_private.protect_owner() from public,anon,authenticated;
drop trigger if exists ims_portal_protect_owner on public.staff_profiles;
create trigger ims_portal_protect_owner before update or delete on public.staff_profiles for each row execute function ims_portal_private.protect_owner();
commit;
