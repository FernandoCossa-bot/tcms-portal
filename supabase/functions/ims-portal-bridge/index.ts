import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.2';
const portal='https://yvrrfedbaugqfgrvnmar.supabase.co';
const publicKey='sb_publishable_HkGBBomCCo6byp1XYgYKyw_9ARjTTuy';
const origins=new Set(['https://fernandocossa-bot.github.io','http://127.0.0.1:5500','http://localhost:5500']);
Deno.serve(async req=>{
 const origin=req.headers.get('origin')||'';
 const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin',
  ...(origins.has(origin)?{'Access-Control-Allow-Origin':origin}:{}),
  'Access-Control-Allow-Headers':'authorization,content-type,apikey,x-client-info',
  'Access-Control-Allow-Methods':'POST,OPTIONS'};
 const reply=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers});
 if(origin&&!origins.has(origin))return reply(403,{error:'Origin denied'});
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return reply(405,{error:'POST required'});
 const authorization=req.headers.get('authorization')||'';
 if(!authorization.startsWith('Bearer '))return reply(401,{error:'Sign in required'});
 try{
  const caller=createClient(portal,publicKey,{global:{headers:{Authorization:authorization}},auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error:authError}=await caller.auth.getUser(authorization.slice(7));
  if(authError||!user)return reply(401,{error:'Invalid session'});
  const {data:context,error:contextError}=await caller.rpc('core_get_my_context');
  if(contextError||context?.user_id!==user.id||context?.can_enter!==true)return reply(403,{error:'Portal access denied'});
  const raw=await req.text();if(raw.length>14500000)return reply(413,{error:'Request too large'});
  let body;try{body=JSON.parse(raw);}catch{return reply(400,{error:'Invalid request'});}
  if(!body||!["access","request_access","access_roles","access_queue","access_history","access_decide","list","create","edit","attendance","attendance_create","attendance_edit","files","departments","locations","projects","staff_names","staff","audit","dashboard","submit","verify","approve","return","reopen","activity_archive","activity_restore","attendance_archive","attendance_restore","file_archive","file_restore","archived_activities","archived_attendance","archived_files","department_save","location_save","project_save","staff_save","activity_create","activity_edit","file_upload","file_download"].includes(body.action))return reply(400,{error:'Unknown operation'});
  const payload=body.payload||{};
  if(['create','edit'].includes(body.action)&&(
    typeof payload.name!=='string'||!payload.name.trim()||payload.name.length>200||
    typeof payload.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(payload.date)||
    typeof payload.location!=='string'||!payload.location.trim()||payload.location.length>200||
    (body.action==='edit'&&(!Number.isSafeInteger(payload.id)||payload.id<1))))return reply(400,{error:'Check activity details'});
  const module=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
  if(['access','request_access','access_roles','access_queue','access_history','access_decide'].includes(body.action)){
   const trustedPayload=body.action==='request_access'?{reason:payload.reason,verified_label:context.display_name||user.email||user.id}:payload;
   const result=await module.rpc('ims_portal_access',{p_actor:user.id,p_action:body.action,p_payload:trustedPayload});
   if(result.error)return reply(result.error.code==='42501'?403:result.error.code==='40001'?409:400,{error:result.error.code==='40001'?'Request changed. Refresh and review again.':'IMS access operation refused'});
   return reply(200,{data:result.data});
  }
  const dispatch=async(action:string,payload:unknown)=>module.rpc('ims_portal_dispatch',{p_portal_id:user.id,p_action:action,p_payload:payload});
  if(body.action==='file_upload'){
   const types=new Set(['image/jpeg','image/png','image/webp','image/gif','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation','text/plain','text/csv']);
   if(!Number.isSafeInteger(payload.id)||payload.id<1||typeof payload.name!=='string'||!payload.name.trim()||payload.name.length>200||!types.has(payload.mime)||typeof payload.base64!=='string'||typeof payload.caption!=='string'||payload.caption.length>2000)return reply(400,{error:'Check file details'});
   const check=await dispatch('file_upload_check',{id:payload.id});if(check.error)return reply(403,{error:'Upload not allowed'});
   const access=await dispatch('access',{});if(access.error||!access.data?.allowed)return reply(403,{error:'IMS access denied'});
   let bytes;try{bytes=Uint8Array.from(atob(payload.base64),c=>c.charCodeAt(0));}catch{return reply(400,{error:'Invalid file encoding'});}
   if(!bytes.length||bytes.length>10485760)return reply(400,{error:'File must be between 1 byte and 10 MB'});
   const path='session-'+payload.id+'/portal-'+access.data.local_id+'/'+crypto.randomUUID();
   const uploaded=await module.storage.from('session-files').upload(path,bytes,{contentType:payload.mime,upsert:false});
   if(uploaded.error)return reply(400,{error:'File upload failed'});
   const saved=await dispatch('file_register',{id:payload.id,path,name:payload.name,mime:payload.mime,size:bytes.length,caption:payload.caption});
   if(saved.error){await module.storage.from('session-files').remove([path]);return reply(400,{error:'File registration failed; upload removed'});}
   return reply(200,{data:saved.data});
  }
  if(body.action==='file_download'){
   const file=await dispatch('file_download_check',payload);if(file.error||!file.data)return reply(403,{error:'File unavailable'});
   const signed=await module.storage.from('session-files').createSignedUrl(file.data.path,60,{download:file.data.name});
   if(signed.error)return reply(400,{error:'File unavailable'});
   return reply(200,{data:{url:signed.data.signedUrl,name:file.data.name}});
  }
  const {data,error}=await module.rpc('ims_portal_dispatch',{p_portal_id:user.id,p_action:body.action,p_payload:payload});
  if(error)return reply(error.code==='42501'?403:400,{error:'IMS operation refused'});
  return reply(200,{data});
 }catch{return reply(503,{error:'Integration temporarily unavailable'});}
});
