-- All fixtures and changes are rolled back; no emails and no permanent grants.
begin;
do $test$
declare
  owner_id uuid := 'd053b3a4-72fb-484e-8a76-20a911f5875e';
  member_id uuid := 'fe525c07-7b76-472d-b907-d76c5056907f';
  v uuid; r uuid; own_r uuid; res jsonb; payload jsonb; denied boolean; settings jsonb; base_version integer;
begin
  select coalesce((select version from public.core_module_access where user_id=member_id),0) into base_version;
  if has_function_privilege('anon','public.tcms_api(text,jsonb)','EXECUTE') then raise exception 'FAIL anonymous execute'; end if;
  if has_table_privilege('authenticated','public.transport_requests','SELECT')
    or has_table_privilege('authenticated','public.core_module_access','UPDATE') then raise exception 'FAIL direct access'; end if;
  if exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public'
    and c.relname in ('core_module_access','transport_vehicles','transport_requests') and not c.relrowsecurity) then raise exception 'FAIL RLS'; end if;
  perform set_config('request.jwt.claim.sub',owner_id::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated')::text,true);
  res:=public.tcms_api('save_vehicle',jsonb_build_object('registration','TCMS-TEST-'||left(gen_random_uuid()::text,8),
    'name','Acceptance test vehicle','capacity',4,'mileage',0,'status','available'));
  v:=(res->>'id')::uuid;
  payload:=jsonb_build_object('vehicle_id',v,'destination','Test destination','purpose','Rolled-back acceptance test',
    'passengers',2,'starts_at',now()+interval '10 days','ends_at',now()+interval '10 days 2 hours','status','pending');
  denied:=false;
  begin perform public.tcms_api('save_request',payload||jsonb_build_object('passengers',5));
  exception when sqlstate '22023' then denied:=true; end;
  if not denied then raise exception 'FAIL capacity exceeded'; end if;
  res:=public.tcms_api('save_request',payload);
  r:=(res->>'id')::uuid;
  denied:=false;
  begin perform public.tcms_api('save_request',payload);
  exception when sqlstate '22023' then denied:=true; end;
  if not denied then raise exception 'FAIL double booking'; end if;
  denied:=false;
  begin perform public.tcms_api('save_request',payload||jsonb_build_object('id',r,'version',99));
  exception when sqlstate '40001' then denied:=true; end;
  if not denied then raise exception 'FAIL stale write'; end if;
  perform public.tcms_api('save_request',payload||jsonb_build_object('id',r,'version',1,'status','approved'));

  perform set_config('request.jwt.claim.sub',member_id::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',member_id,'role','authenticated')::text,true);
  denied:=false;
  begin perform public.tcms_api('vehicles');
  exception when sqlstate '42501' then denied:=true; end;
  if not denied then raise exception 'FAIL unassigned member access'; end if;
  denied:=false;
  begin perform public.tcms_api('directory');
  exception when sqlstate '42501' then denied:=true; end;
  if not denied then raise exception 'FAIL member directory'; end if;

  perform set_config('request.jwt.claim.sub',owner_id::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated')::text,true);
  perform public.tcms_api('set_permissions',jsonb_build_object('user_id',member_id,'role','requester',
    'overrides','{}'::jsonb,'version',base_version,'reason','Temporary rollback test'));
  perform set_config('request.jwt.claim.sub',member_id::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',member_id,'role','authenticated')::text,true);
  res:=public.tcms_api('requests');
  if jsonb_array_length(res)<>0 then raise exception 'FAIL row isolation'; end if;
  denied:=false;
  begin perform public.tcms_api('save_vehicle',jsonb_build_object('registration','FORBIDDEN','name','Forbidden','capacity',4,'mileage',0,'status','available'));
  exception when sqlstate '42501' then denied:=true; end;
  if not denied then raise exception 'FAIL requester fleet'; end if;
  denied:=false;
  begin perform public.tcms_api('save_request',payload||jsonb_build_object('id',r,'version',2));
  exception when sqlstate '42501' then denied:=true; end;
  if not denied then raise exception 'FAIL edit another user'; end if;
  payload:=payload||jsonb_build_object('starts_at',now()+interval '11 days','ends_at',now()+interval '11 days 2 hours');
  res:=public.tcms_api('save_request',payload);
  own_r:=(res->>'id')::uuid;
  perform public.tcms_api('save_request',payload||jsonb_build_object('id',own_r,'version',1,'destination','Edited destination'));
  res:=public.tcms_api('requests');
  if jsonb_array_length(res)<>1 or res->0->>'registration' is null then raise exception 'FAIL related table display'; end if;
  denied:=false;
  begin perform public.tcms_api('save_request',payload||jsonb_build_object('id',own_r,'version',2,'status','approved'));
  exception when sqlstate '42501' then denied:=true; end;
  if not denied then raise exception 'FAIL requester approval'; end if;
  denied:=false;
  begin perform public.core_set_global_access(false,1,'Unauthorized global change');
  exception when sqlstate '42501' then denied:=true; end;
  if not denied then raise exception 'FAIL member global switch'; end if;

  perform set_config('request.jwt.claim.sub',owner_id::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated')::text,true);
  settings:=public.core_get_access_control();
  perform public.core_set_global_access(false,(settings->>'version')::bigint,'Temporary rollback test');
  perform public.tcms_api('vehicles'); -- Owner remains able to operate.
  perform set_config('request.jwt.claim.sub',member_id::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',member_id,'role','authenticated')::text,true);
  denied:=false;
  begin perform public.tcms_api('vehicles');
  exception when sqlstate '42501' then denied:=true; end;
  if not denied then raise exception 'FAIL global blocking'; end if;
  perform set_config('request.jwt.claim.sub',owner_id::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated')::text,true);
  settings:=public.core_get_access_control();
  perform public.core_set_global_access(true,(settings->>'version')::bigint,'Temporary rollback restore');
  perform public.tcms_api('set_permissions',jsonb_build_object('user_id',member_id,'role','requester',
    'overrides','{"create_request":"deny"}'::jsonb,'version',base_version+1,'reason','Temporary override test'));
  perform set_config('request.jwt.claim.sub',member_id::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',member_id,'role','authenticated')::text,true);
  denied:=false;
  begin perform public.tcms_api('save_request',payload);
  exception when sqlstate '42501' then denied:=true; end;
  if not denied then raise exception 'FAIL deny override'; end if;
  insert into public.core_platform_roles(user_id,role_code) values(member_id,'restricted_admin');
  denied:=false;
  begin perform public.tcms_api('set_permissions',jsonb_build_object('user_id',owner_id,'role','dispatcher',
    'overrides','{}'::jsonb,'version',0,'reason','Attempt to modify owner'));
  exception when sqlstate '42501' then denied:=true; end;
  if not denied then raise exception 'FAIL protected owner'; end if;
  update public.core_profiles set account_status='suspended' where user_id=member_id;
  denied:=false;
  begin perform public.tcms_api('vehicles');
  exception when sqlstate '42501' then denied:=true; end;
  if not denied then raise exception 'FAIL suspended account'; end if;
  if not exists(select 1 from public.core_audit_events where target_id=own_r and action='transport.request_saved') then raise exception 'FAIL audit'; end if;
end $test$;
rollback;
select 'PASS: permissions, isolation, create/edit, related tables, conflicts, stale writes, global block, audit; fixtures rolled back' as test_result;
