begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000004',true);
do $$
declare q text; blocked boolean;
begin
 foreach q in array array[
  'select public.list_items()',
  'select public.get_stock()',
  'select public.list_movements(null)',
  'select public.add_item(''DENIED TEST'')',
  'select public.update_item(-1,''DENIED TEST'')',
  'select public.add_movement(-1,''IN'',1)',
  'select public.update_movement(-1,-1,''IN'',1)',
  'select public.list_accounts_with_roles()',
  'select public.list_history()',
  'select public.assign_role(''nonexistent@example.invalid'',''ADMIN'')',
  'select public.revoke_role(''nonexistent@example.invalid'')'
 ] loop
  blocked:=false;
  begin execute q;
  exception when others then
   if sqlerrm like 'Access denied%' then blocked:=true; else raise; end if;
  end;
  if not blocked then raise exception 'FAIL: unassigned identity allowed: %',q; end if;
 end loop;
end $$;
reset role;
rollback;
select 'PASS: all 11 protected functions rejected an authenticated identity without a module role; test transaction rolled back' as result;
