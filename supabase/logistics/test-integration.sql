begin;
do $$
declare owner_id uuid:='d053b3a4-72fb-484e-8a76-20a911f5875e';
 test_id uuid:='00000000-0000-4000-8000-000000004004';
 data jsonb; denied boolean; role_name text; item_id bigint; movement_id bigint;
begin
 data:=public.logistics_portal_dispatch(owner_id,'access');
 if data->>'allowed'<>'true' or (data->>'level')::int<>4 then raise exception 'Owner access failed'; end if;
 data:=public.logistics_portal_dispatch(test_id,'access');
 if data->>'allowed'<>'false' then raise exception 'Unassigned account allowed'; end if;
 denied:=false;
 begin perform public.logistics_portal_dispatch(test_id,'stock'); exception when insufficient_privilege then denied:=true; end;
 if not denied then raise exception 'Unassigned read allowed'; end if;
 perform public.logistics_portal_dispatch(test_id,'request_access','{"verified_label":"Rollback acceptance account","reason":"Temporary integration test"}');
 for role_name in select unnest(array['VIEWER','OPERATOR','MANAGER','ADMIN']) loop
  perform public.logistics_portal_dispatch(owner_id,'decide',jsonb_build_object('portal_id',test_id,'version',(select version from public."Tbl04PortalAccess" where portal_id=test_id),'status','approved','role',role_name,'reason','Temporary role acceptance test'));
  perform public.logistics_portal_dispatch(test_id,'stock');
  if role_name='VIEWER' then
   denied:=false;
   begin perform public.logistics_portal_dispatch(test_id,'add_item','{"name":"Must not save"}'); exception when insufficient_privilege then denied:=true; end;
   if not denied then raise exception 'Viewer write allowed'; end if;
  elsif role_name='OPERATOR' then
   data:=public.logistics_portal_dispatch(test_id,'add_item','{"name":"ROLLBACK ONLY integration item"}'); item_id:=(data->>'id')::bigint;
   data:=public.logistics_portal_dispatch(test_id,'add_movement',jsonb_build_object('item_id',item_id,'quantity',10,'movement_type','IN')); movement_id:=(data->>'id')::bigint;
   denied:=false;
   begin perform public.logistics_portal_dispatch(test_id,'edit_movement',jsonb_build_object('id',movement_id,'previous_quantity',10,'quantity',12)); exception when insufficient_privilege then denied:=true; end;
   if not denied then raise exception 'Operator edit allowed'; end if;
  elsif role_name='MANAGER' then
   perform public.logistics_portal_dispatch(test_id,'edit_movement',jsonb_build_object('id',movement_id,'previous_quantity',10,'quantity',12));
   denied:=false;
   begin perform public.logistics_portal_dispatch(test_id,'edit_movement',jsonb_build_object('id',movement_id,'previous_quantity',10,'quantity',13)); exception when serialization_failure then denied:=true; end;
   if not denied then raise exception 'Stale edit allowed'; end if;
  end if;
  if role_name<>'ADMIN' then
   denied:=false;
   begin perform public.logistics_portal_dispatch(test_id,'queue'); exception when insufficient_privilege then denied:=true; end;
   if not denied then raise exception 'Non-admin queue allowed'; end if;
  else
   perform public.logistics_portal_dispatch(test_id,'queue');
   denied:=false;
   begin perform public.logistics_portal_dispatch(test_id,'decide',jsonb_build_object('portal_id',owner_id,'version',1,'status','revoked','reason','Must not remove Owner')); exception when insufficient_privilege then denied:=true; end;
   if not denied then raise exception 'Owner removal allowed'; end if;
  end if;
 end loop;
 perform public.logistics_portal_dispatch(owner_id,'decide',jsonb_build_object('portal_id',test_id,'version',(select version from public."Tbl04PortalAccess" where portal_id=test_id),'status','revoked','reason','Temporary test revocation'));
 denied:=false;
 begin perform public.logistics_portal_dispatch(test_id,'stock'); exception when insufficient_privilege then denied:=true; end;
 if not denied then raise exception 'Revoked account allowed'; end if;
end $$;
rollback;
select 'PASS: Owner, unassigned, pending request, Viewer, Operator, Manager, Admin, stale edits, protected Owner and revocation; all test records rolled back' as result,
(select count(*) from public.items) as items,(select count(*) from public.stock_movements) as movements;
