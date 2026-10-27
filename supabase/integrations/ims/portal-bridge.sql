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
 when 'access' then return jsonb_build_object('allowed',true,'role',(select role from public.staff_profiles where id=actor),'is_admin',public.is_admin());
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
