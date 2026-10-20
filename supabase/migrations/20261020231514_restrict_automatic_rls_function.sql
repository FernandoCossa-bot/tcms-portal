-- Supabase's automatic-RLS event trigger is internal, not a browser RPC.
-- Keep its definition and event trigger intact; remove unnecessary API execution.
begin;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
commit;
select
  has_function_privilege('anon','public.rls_auto_enable()','EXECUTE') as anon_execute,
  has_function_privilege('authenticated','public.rls_auto_enable()','EXECUTE') as authenticated_execute;
