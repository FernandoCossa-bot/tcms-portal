begin;
set local lock_timeout = '5s';
CREATE OR REPLACE FUNCTION public.add_movement(p_item_id bigint, p_movement_type text, p_quantity integer)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = pg_catalog, public
AS $function$
DECLARE v_level int; v_result json; BEGIN
 SELECT coalesce(r.level_number, 0) INTO v_level FROM public."Tbl04UserRole" ur JOIN public."Tbl04Role" r ON ur.role_id = r.role_id WHERE ur.user_id = auth.uid();
 IF auth.uid() IS NULL OR coalesce(v_level,0) < 2 THEN RAISE EXCEPTION 'Access denied (Requires Operator Level 2+).'; END IF;
 IF p_quantity <= 0 THEN RAISE EXCEPTION 'Quantity must be greater than zero.'; END IF;
 INSERT INTO public.stock_movements (item_id, movement_type, quantity) VALUES (p_item_id, p_movement_type, p_quantity) RETURNING to_json(stock_movements.*) INTO v_result; RETURN v_result;
END; $function$
;
revoke all on function public.add_movement(bigint,text,integer) from public, anon;
grant execute on function public.add_movement(bigint,text,integer) to authenticated;
CREATE OR REPLACE FUNCTION public.update_movement(p_id bigint, p_item_id bigint, p_movement_type text, p_quantity integer)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = pg_catalog, public
AS $function$
DECLARE v_level int; v_result json; BEGIN
 SELECT coalesce(r.level_number, 0) INTO v_level FROM public."Tbl04UserRole" ur JOIN public."Tbl04Role" r ON ur.role_id = r.role_id WHERE ur.user_id = auth.uid();
 IF auth.uid() IS NULL OR coalesce(v_level,0) < 3 THEN RAISE EXCEPTION 'Access denied (Requires Manager Level 3+).'; END IF;
 IF p_quantity <= 0 THEN RAISE EXCEPTION 'Quantity must be greater than zero.'; END IF;
 UPDATE public.stock_movements SET item_id = p_item_id, movement_type = p_movement_type, quantity = p_quantity WHERE id = p_id RETURNING to_json(stock_movements.*) INTO v_result; RETURN v_result;
END; $function$
;
revoke all on function public.update_movement(bigint,bigint,text,integer) from public, anon;
grant execute on function public.update_movement(bigint,bigint,text,integer) to authenticated;
CREATE OR REPLACE FUNCTION public.update_item(p_id bigint, p_name text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = pg_catalog, public
AS $function$
DECLARE
 v_result json;
BEGIN
 IF auth.uid() IS NULL OR coalesce((select r.level_number from public."Tbl04UserRole" u join public."Tbl04Role" r using(role_id) where u.user_id=auth.uid()),0)<3 THEN RAISE EXCEPTION 'Access denied' USING ERRCODE='42501'; END IF;
 IF p_name IS NULL OR length(btrim(p_name))=0 OR length(p_name)>200 THEN RAISE EXCEPTION 'Invalid item name'; END IF;
 UPDATE public.items
 SET name = p_name
 WHERE id = p_id
 RETURNING to_json(items.*) INTO v_result;
 RETURN v_result;
END;
$function$
;
revoke all on function public.update_item(bigint,text) from public, anon;
grant execute on function public.update_item(bigint,text) to authenticated;
CREATE OR REPLACE FUNCTION public.get_stock()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = pg_catalog, public
AS $function$
DECLARE v_level int; v_result json; BEGIN
 SELECT coalesce(r.level_number, 0) INTO v_level FROM public."Tbl04UserRole" ur JOIN public."Tbl04Role" r ON ur.role_id = r.role_id WHERE ur.user_id = auth.uid();
 IF auth.uid() IS NULL OR coalesce(v_level,0) < 1 THEN RAISE EXCEPTION 'Access denied (Requires Level 1+).'; END IF;
 SELECT coalesce(json_agg(t), '[]'::json) INTO v_result FROM (SELECT i.id, i.name, coalesce(SUM(CASE WHEN m.movement_type = 'IN' THEN m.quantity ELSE -m.quantity END), 0) AS current_stock FROM public.items i LEFT JOIN public.stock_movements m ON i.id = m.item_id GROUP BY i.id, i.name ORDER BY i.id ASC) t; RETURN v_result;
END; $function$
;
revoke all on function public.get_stock() from public, anon;
grant execute on function public.get_stock() to authenticated;
CREATE OR REPLACE FUNCTION public.add_item(p_name text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = pg_catalog, public
AS $function$
DECLARE v_level int; v_result json; BEGIN
 SELECT coalesce(r.level_number, 0) INTO v_level FROM public."Tbl04UserRole" ur JOIN public."Tbl04Role" r ON ur.role_id = r.role_id WHERE ur.user_id = auth.uid();
 IF auth.uid() IS NULL OR coalesce(v_level,0) < 2 THEN RAISE EXCEPTION 'Access denied (Requires Operator Level 2+).'; END IF;
 INSERT INTO public.items (name) VALUES (p_name) RETURNING to_json(items.*) INTO v_result; RETURN v_result;
END; $function$
;
revoke all on function public.add_item(text) from public, anon;
grant execute on function public.add_item(text) to authenticated;
CREATE OR REPLACE FUNCTION public.get_my_role()
 RETURNS json
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path = pg_catalog, public
AS $function$
 SELECT to_json(r.*)
 FROM public."Tbl04UserRole" ur
 JOIN public."Tbl04Role" r ON ur.role_id = r.role_id
 WHERE ur.user_id = auth.uid();
$function$
;
revoke all on function public.get_my_role() from public, anon;
grant execute on function public.get_my_role() to authenticated;
CREATE OR REPLACE FUNCTION public.assign_role(p_email text, p_role_code text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = pg_catalog, public
AS $function$
DECLARE
 v_admin_level int;
 v_target_user_id uuid;
 v_new_role_id bigint;
 v_old_role_id bigint;
 v_action text;
BEGIN
 PERFORM pg_catalog.pg_advisory_xact_lock(404004);
 SELECT coalesce(r.level_number, 0) INTO v_admin_level FROM public."Tbl04UserRole" ur JOIN public."Tbl04Role" r ON ur.role_id = r.role_id WHERE ur.user_id = auth.uid();
 IF auth.uid() IS NULL OR coalesce(v_admin_level,0) < 4 THEN RAISE EXCEPTION 'Access denied. Requires Administrator (Level 4).'; END IF;

 SELECT id INTO v_target_user_id FROM auth.users WHERE email = p_email;
 IF v_target_user_id IS NULL THEN RAISE EXCEPTION 'User with email % not found.', p_email; END IF;

 SELECT role_id INTO v_new_role_id FROM public."Tbl04Role" WHERE role_code = p_role_code;
 IF v_new_role_id IS NULL THEN RAISE EXCEPTION 'Role code % not found.', p_role_code; END IF;

 SELECT role_id INTO v_old_role_id FROM public."Tbl04UserRole" WHERE user_id = v_target_user_id;

 IF v_old_role_id = (select role_id from public."Tbl04Role" where role_code='ADMIN')
 AND v_new_role_id <> v_old_role_id AND (select count(*) from public."Tbl04UserRole" where role_id=v_old_role_id)<=1
 THEN RAISE EXCEPTION 'Cannot downgrade the last Administrator.'; END IF;
 IF v_old_role_id IS NULL THEN
 v_action := 'grant';
 INSERT INTO public."Tbl04UserRole" (user_id, role_id, granted_by, granted_at) VALUES (v_target_user_id, v_new_role_id, auth.uid(), now());
 ELSE
 v_action := 'change';
 UPDATE public."Tbl04UserRole" SET role_id = v_new_role_id, granted_by = auth.uid(), granted_at = now() WHERE user_id = v_target_user_id;
 END IF;

 INSERT INTO public."Tbl04RoleLog" (user_id, old_role_id, new_role_id, action, changed_by, changed_at)
 VALUES (v_target_user_id, v_old_role_id, v_new_role_id, v_action, auth.uid(), now());

 RETURN 'Role assigned successfully.';
END;
$function$
;
revoke all on function public.assign_role(text,text) from public, anon;
grant execute on function public.assign_role(text,text) to authenticated;
CREATE OR REPLACE FUNCTION public.revoke_role(p_email text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = pg_catalog, public
AS $function$
DECLARE
 v_admin_level int;
 v_target_user_id uuid;
 v_old_role_id bigint;
 v_admin_role_id bigint;
 v_admin_count int;
BEGIN
 PERFORM pg_catalog.pg_advisory_xact_lock(404004);
 SELECT coalesce(r.level_number, 0) INTO v_admin_level FROM public."Tbl04UserRole" ur JOIN public."Tbl04Role" r ON ur.role_id = r.role_id WHERE ur.user_id = auth.uid();
 IF auth.uid() IS NULL OR coalesce(v_admin_level,0) < 4 THEN RAISE EXCEPTION 'Access denied. Requires Administrator (Level 4).'; END IF;

 SELECT id INTO v_target_user_id FROM auth.users WHERE email = p_email;
 IF v_target_user_id IS NULL THEN RAISE EXCEPTION 'User with email % not found.', p_email; END IF;

 SELECT role_id INTO v_old_role_id FROM public."Tbl04UserRole" WHERE user_id = v_target_user_id;
 IF v_old_role_id IS NULL THEN RAISE EXCEPTION 'User does not have a role to revoke.'; END IF;

 SELECT role_id INTO v_admin_role_id FROM public."Tbl04Role" WHERE role_code = 'ADMIN';
 IF v_old_role_id = v_admin_role_id THEN
 SELECT count(*) INTO v_admin_count FROM public."Tbl04UserRole" WHERE role_id = v_admin_role_id;
 IF v_admin_count <= 1 THEN RAISE EXCEPTION 'Cannot revoke the last Administrator.'; END IF;
 END IF;

 DELETE FROM public."Tbl04UserRole" WHERE user_id = v_target_user_id;
 INSERT INTO public."Tbl04RoleLog" (user_id, old_role_id, new_role_id, action, changed_by, changed_at)
 VALUES (v_target_user_id, v_old_role_id, NULL, 'revoke', auth.uid(), now());

 RETURN 'Role revoked successfully.';
END;
$function$
;
revoke all on function public.revoke_role(text) from public, anon;
grant execute on function public.revoke_role(text) to authenticated;
CREATE OR REPLACE FUNCTION public.list_accounts_with_roles()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = pg_catalog, public
AS $function$
DECLARE
 v_admin_level int; v_result json;
BEGIN
 SELECT coalesce(r.level_number, 0) INTO v_admin_level FROM public."Tbl04UserRole" ur JOIN public."Tbl04Role" r ON ur.role_id = r.role_id WHERE ur.user_id = auth.uid();
 IF auth.uid() IS NULL OR coalesce(v_admin_level,0) < 4 THEN RAISE EXCEPTION 'Access denied.'; END IF;

 SELECT coalesce(json_agg(t), '[]'::json) INTO v_result
 FROM (
 SELECT u.email, r.role_code, r.role_name, r.level_number, ur.granted_at
 FROM public."Tbl04UserRole" ur
 JOIN public."Tbl04Role" r ON ur.role_id = r.role_id
 JOIN auth.users u ON u.id = ur.user_id
 ORDER BY r.level_number DESC, u.email ASC
 ) t;
 RETURN v_result;
END;
$function$
;
revoke all on function public.list_accounts_with_roles() from public, anon;
grant execute on function public.list_accounts_with_roles() to authenticated;
CREATE OR REPLACE FUNCTION public.list_history()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = pg_catalog, public
AS $function$
DECLARE
 v_admin_level int; v_result json;
BEGIN
 SELECT coalesce(r.level_number, 0) INTO v_admin_level FROM public."Tbl04UserRole" ur JOIN public."Tbl04Role" r ON ur.role_id = r.role_id WHERE ur.user_id = auth.uid();
 IF auth.uid() IS NULL OR coalesce(v_admin_level,0) < 4 THEN RAISE EXCEPTION 'Access denied.'; END IF;

 SELECT coalesce(json_agg(t), '[]'::json) INTO v_result
 FROM (
 SELECT u.email AS target_email, ro.role_name AS old_role, rn.role_name AS new_role, l.action, ub.email AS changed_by_email, l.changed_at
 FROM public."Tbl04RoleLog" l
 JOIN auth.users u ON u.id = l.user_id
 LEFT JOIN public."Tbl04Role" ro ON ro.role_id = l.old_role_id
 LEFT JOIN public."Tbl04Role" rn ON rn.role_id = l.new_role_id
 LEFT JOIN auth.users ub ON ub.id = l.changed_by
 ORDER BY l.changed_at DESC
 ) t;
 RETURN v_result;
END;
$function$
;
revoke all on function public.list_history() from public, anon;
grant execute on function public.list_history() to authenticated;
CREATE OR REPLACE FUNCTION public.list_items()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = pg_catalog, public
AS $function$
DECLARE v_level int; v_result json; BEGIN
 SELECT coalesce(r.level_number, 0) INTO v_level FROM public."Tbl04UserRole" ur JOIN public."Tbl04Role" r ON ur.role_id = r.role_id WHERE ur.user_id = auth.uid();
 IF auth.uid() IS NULL OR coalesce(v_level,0) < 1 THEN RAISE EXCEPTION 'Access denied (Requires Level 1+).'; END IF;
 SELECT coalesce(json_agg(t), '[]'::json) INTO v_result FROM (SELECT id, name, created_at FROM public.items ORDER BY id ASC) t; RETURN v_result;
END; $function$
;
revoke all on function public.list_items() from public, anon;
grant execute on function public.list_items() to authenticated;
CREATE OR REPLACE FUNCTION public.list_movements(p_item_id bigint DEFAULT NULL::bigint)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = pg_catalog, public
AS $function$
DECLARE v_level int; v_result json; BEGIN
 SELECT coalesce(r.level_number, 0) INTO v_level FROM public."Tbl04UserRole" ur JOIN public."Tbl04Role" r ON ur.role_id = r.role_id WHERE ur.user_id = auth.uid();
 IF auth.uid() IS NULL OR coalesce(v_level,0) < 1 THEN RAISE EXCEPTION 'Access denied (Requires Level 1+).'; END IF;
 SELECT coalesce(json_agg(t), '[]'::json) INTO v_result FROM (SELECT m.id, m.item_id, i.name AS item_name, m.movement_type, m.quantity, m.movement_date FROM public.stock_movements m JOIN public.items i ON i.id = m.item_id WHERE (p_item_id IS NULL OR m.item_id = p_item_id) ORDER BY m.movement_date DESC, m.id DESC) t; RETURN v_result;
END; $function$
;
revoke all on function public.list_movements(bigint) from public, anon;
grant execute on function public.list_movements(bigint) to authenticated;
revoke all on table public."items" from public, anon, authenticated;
revoke all on table public."stock_movements" from public, anon, authenticated;
revoke all on table public."Tbl04Role" from public, anon, authenticated;
revoke all on table public."Tbl04UserRole" from public, anon, authenticated;
revoke all on table public."Tbl04RoleLog" from public, anon, authenticated;
revoke all on table public."user_roles" from public, anon, authenticated;
drop policy "Allow public insert access on items" on public."items";
drop policy "Allow public read access on items" on public."items";
drop policy "Allow public insert access on stock_movements" on public."stock_movements";
drop policy "Allow public read access on stock_movements" on public."stock_movements";
commit;
select (select count(*) from public.items) as items, (select count(*) from public.stock_movements) as movements, (select count(*) from public."Tbl04UserRole") as roles;