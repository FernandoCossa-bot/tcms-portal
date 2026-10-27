begin;
alter table public.core_profiles add column must_change_password boolean not null default false;
alter table public.core_profiles alter column must_change_password set default true;
create function tcms_private.password_changed() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.encrypted_password is distinct from old.encrypted_password and coalesce(new.encrypted_password,'') <> '' then
 update public.core_profiles set must_change_password=false,updated_at=now() where user_id=new.id;
 end if;
 return new;
end $$;
revoke all on function tcms_private.password_changed() from public,anon,authenticated;
create trigger tcms_password_changed after update of encrypted_password on auth.users for each row execute function tcms_private.password_changed();
create or replace function public.core_get_my_context() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare
 actor uuid:=auth.uid(); profile public.core_profiles%rowtype; platform_role text; verified boolean; enabled boolean; allowed boolean;
begin
 if actor is null then raise exception 'Sign-in required' using errcode='42501'; end if;
 select * into profile from public.core_profiles where user_id=actor;
 if not found then raise exception 'Account profile unavailable' using errcode='42501'; end if;
 select role_code into platform_role from public.core_platform_roles where user_id=actor;
 select email_confirmed_at is not null into verified from auth.users where id=actor;
 select access_enabled into enabled from public.core_system_settings where id=1;
 allowed:=profile.account_status='active' and coalesce(verified,false) and (coalesce(enabled,false) or platform_role is not distinct from 'system_owner');
 return jsonb_build_object('user_id',actor,'display_name',profile.display_name,'account_status',profile.account_status,
 'platform_role',coalesce(platform_role,'member'),'email_verified',coalesce(verified,false),'access_enabled',coalesce(enabled,false),
 'account_can_enter',allowed,'must_change_password',profile.must_change_password,'can_enter',allowed and not profile.must_change_password);
end $$;
create table public.core_modules (
 code text primary key, name text not null, description text not null,
 integration_status text not null check(integration_status in ('pending','transport_available')),
 sort_order integer not null unique
);
alter table public.core_modules enable row level security;
revoke all on public.core_modules from public,anon,authenticated;
insert into public.core_modules values
('foundation','Foundation & Charitable Services','Activities, community support and charitable services.','pending',1),
('education','Education & Vocational Training','Courses, students, teaching and attendance.','pending',2),
('farm','Farm Management','Agricultural activities, production and farm resources.','pending',3),
('logistics','Logistics & Warehouse Management','Transportation is available. Warehouse integration is pending.','transport_available',4);
create function public.core_get_module_catalog() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not coalesce((public.core_get_my_context()->>'can_enter')::boolean,false) then raise exception 'Access denied' using errcode='42501'; end if;
 return (select jsonb_agg(to_jsonb(m) order by sort_order) from public.core_modules m);
end $$;
revoke all on function public.core_get_module_catalog() from public,anon,authenticated;
grant execute on function public.core_get_module_catalog() to authenticated;
commit;
