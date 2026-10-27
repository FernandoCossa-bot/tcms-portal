begin;
alter table public.hr_account_requests add column provisioning_token text not null default (replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-',''));
create unique index hr_account_requests_provisioning_token_key on public.hr_account_requests(provisioning_token);
do $$ declare d text; begin
 d:=pg_get_functiondef('tcms_private.core_hr_prepare_account(uuid,text,text,text,text)'::regprocedure);
 d:=replace(d,'''user_id'',ticket.user_id)', '''user_id'',ticket.user_id,''provisioning_token'',case when ticket.user_id is null then ticket.provisioning_token else null end)');
 d:=replace(d,'return jsonb_build_object(''created'',false);','return jsonb_build_object(''created'',false,''provisioning_token'',(select provisioning_token from public.hr_account_requests where id=p_id));');
 execute d;
 d:=pg_get_functiondef('public.core_on_user_created()'::regprocedure);
 d:=replace(d,'where id=(new.raw_app_meta_data->>''tcms_request_id'')::uuid','where provisioning_token=new.raw_user_meta_data->>''tcms_provisioning_token''');
 execute d;
end $$;
commit;
