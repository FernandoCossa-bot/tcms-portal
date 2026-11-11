begin;
alter table public."Tbl04PortalAccess" add column if not exists email text;
create or replace function public.logistics_portal_dispatch(p_actor uuid,p_action text,p_payload jsonb default '{}')
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare
 a public."Tbl04PortalAccess"%rowtype;
 target_user public."Tbl04PortalAccess"%rowtype;
 lvl int:=0; result jsonb; old_row public.stock_movements%rowtype;
 selected_id bigint; qty int; selected_type text; new_name text;
 target_id uuid; decision text; selected_role text;
begin
 if p_actor is null then raise exception 'Access denied' using errcode='42501'; end if;
 select * into a from public."Tbl04PortalAccess" where portal_id=p_actor;
 if a.status='approved' then
  select level_number into lvl from public."Tbl04Role" where role_code=a.role_code;
 end if;
 lvl:=coalesce(lvl,0);
 if p_action='access' then
  if p_payload->>'verified_email' is not null then update public."Tbl04PortalAccess" set email=p_payload->>'verified_email' where portal_id=p_actor; end if;
  return jsonb_build_object('allowed',lvl>0,'level',lvl,'role',a.role_code,'status',coalesce(a.status,'not_requested'),'version',a.version);
 end if;
 if p_action='request_access' then
  if length(btrim(coalesce(p_payload->>'verified_label','')))=0 or length(p_payload->>'verified_label')>200
   or length(btrim(coalesce(p_payload->>'reason','')))<5 or length(p_payload->>'reason')>500 then
   raise exception 'Check request details' using errcode='22023'; end if;
  insert into public."Tbl04PortalAccess"(portal_id,display_name,reason,email)
  values(p_actor,p_payload->>'verified_label',btrim(p_payload->>'reason'),p_payload->>'verified_email')
  on conflict(portal_id) do nothing;
  -- Rejected/revoked accounts require administrator review; no automatic reopening.
  return jsonb_build_object('requested',true);
 end if;
 if lvl<1 then raise exception 'Module access required' using errcode='42501'; end if;
 if p_action in ('queue','audit','decide') then
  if lvl<4 then raise exception 'Administrator required' using errcode='42501'; end if;
  if p_action='queue' then
   select coalesce(jsonb_agg(to_jsonb(t)),'[]') into result from
    (select portal_id,display_name,email,status,role_code,protected_owner,reason,version from public."Tbl04PortalAccess" order by updated_at desc limit 200) t;
   return result;
  elsif p_action='audit' then
   select coalesce(jsonb_agg(to_jsonb(t)),'[]') into result from
    (select * from public."Tbl04PortalAudit" order by id desc limit 200)t;
   return result;
  end if;
  target_id:=(p_payload->>'portal_id')::uuid;
  select * into target_user from public."Tbl04PortalAccess" where portal_id=target_id for update;
  if not found then raise exception 'Account request not found' using errcode='22023'; end if;
  if target_user.protected_owner or target_id=p_actor then raise exception 'Protected account' using errcode='42501'; end if;
  if target_user.version is distinct from (p_payload->>'version')::int then raise exception 'Request changed' using errcode='40001'; end if;
  decision:=p_payload->>'status'; selected_role:=p_payload->>'role';
  if decision is null or decision not in ('approved','rejected','revoked') or length(btrim(coalesce(p_payload->>'reason','')))<5 or length(p_payload->>'reason')>500 then raise exception 'Check review details' using errcode='22023'; end if;
  if decision='approved' and not exists(select 1 from public."Tbl04Role" where role_code=selected_role and level_number between 1 and 4) then raise exception 'Invalid role' using errcode='22023'; end if;
  update public."Tbl04PortalAccess" set status=decision,role_code=case when decision='approved' then selected_role else null end,reason=p_payload->>'reason',version=version+1,updated_at=now() where portal_id=target_id;
  insert into public."Tbl04PortalAudit"(actor,action,target,details) values(p_actor,'access_decision',target_id::text,jsonb_build_object('before_status',target_user.status,'before_role',target_user.role_code,'status',decision,'role',selected_role,'reason',p_payload->>'reason'));
  return jsonb_build_object('saved',true);
 end if;
 if p_action='stock' then
  select coalesce(jsonb_agg(to_jsonb(t)),'[]') into result from
   (select i.id,i.name,coalesce(sum(case when m.movement_type='IN' then m.quantity::bigint else -m.quantity::bigint end),0) as current_stock from public.items i left join public.stock_movements m on m.item_id=i.id group by i.id,i.name order by i.id)t;
  return result;
 elsif p_action='movements' then
  select coalesce(jsonb_agg(to_jsonb(t)),'[]') into result from
   (select m.*,i.name as item_name from public.stock_movements m join public.items i on i.id=m.item_id order by m.movement_date desc,m.id desc limit 500)t;
  return result;
 end if;
 if lvl<2 then raise exception 'Operator required' using errcode='42501'; end if;
 if p_action='add_item' then
  new_name:=btrim(p_payload->>'name');
  if new_name is null or length(new_name)=0 or length(new_name)>200 then raise exception 'Invalid item name' using errcode='22023'; end if;
  insert into public.items(name) values(new_name) returning to_jsonb(items.*) into result;
 elsif p_action='add_movement' then
  selected_id:=(p_payload->>'item_id')::bigint; qty:=(p_payload->>'quantity')::int; selected_type:=p_payload->>'movement_type';
  if selected_id is null or qty is null or qty<=0 or selected_type is null or selected_type not in ('IN','OUT') then raise exception 'Invalid movement' using errcode='22023'; end if;
  if not exists(select 1 from public.items where id=selected_id) then raise exception 'Item not found' using errcode='22023'; end if;
  insert into public.stock_movements(item_id,movement_type,quantity) values(selected_id,selected_type,qty) returning to_jsonb(stock_movements.*) into result;
 elsif p_action='edit_movement' then
  if lvl<3 then raise exception 'Manager required' using errcode='42501'; end if;
  qty:=(p_payload->>'quantity')::int;
  if qty is null or qty<=0 then raise exception 'Invalid quantity' using errcode='22023'; end if;
  select * into old_row from public.stock_movements where id=(p_payload->>'id')::bigint for update;
  if not found then raise exception 'Movement not found' using errcode='22023'; end if;
  if old_row.quantity is distinct from (p_payload->>'previous_quantity')::int then raise exception 'Movement changed' using errcode='40001'; end if;
  update public.stock_movements set quantity=qty where id=old_row.id returning to_jsonb(stock_movements.*) into result;
 else raise exception 'Unknown operation' using errcode='22023';
 end if;
 insert into public."Tbl04PortalAudit"(actor,action,target,details) values(p_actor,p_action,result->>'id',jsonb_build_object('previous_quantity',old_row.quantity,'result',result));
 return result;
end;
$$;
revoke all on function public.logistics_portal_dispatch(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.logistics_portal_dispatch(uuid,text,jsonb) to service_role;
commit;
