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
  const raw=await req.text();if(raw.length>4096)return reply(413,{error:'Request too large'});
  let body;try{body=JSON.parse(raw);}catch{return reply(400,{error:'Invalid request'});}
  if(!body||!['access','list','create','edit'].includes(body.action))return reply(400,{error:'Unknown operation'});
  const payload=body.payload||{};
  if(['create','edit'].includes(body.action)&&(
    typeof payload.name!=='string'||!payload.name.trim()||payload.name.length>200||
    typeof payload.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(payload.date)||
    typeof payload.location!=='string'||!payload.location.trim()||payload.location.length>200||
    (body.action==='edit'&&(!Number.isSafeInteger(payload.id)||payload.id<1))))return reply(400,{error:'Check activity details'});
  const module=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
  if(user.id==='d053b3a4-72fb-484e-8a76-20a911f5875e' && context.platform_role==='system_owner'){
   const lookup=await module.rpc('ims_portal_owner_setup');
   if(lookup.error)return reply(503,{error:'Owner mapping unavailable'});
   if(!lookup.data){
    const created=await module.auth.admin.createUser({email:'portal-owner-d053b3a4@tcms.example.invalid',email_confirm:true,user_metadata:{display_name:'Fernando Cossa — Portal Owner'}});
    if(created.error||!created.data.user)return reply(503,{error:'Owner provisioning requires review'});
    const mapped=await module.rpc('ims_portal_owner_setup',{p_local_id:created.data.user.id});
    if(mapped.error)return reply(503,{error:'Owner mapping requires review'});
   }
  }
  const {data,error}=await module.rpc('ims_portal_dispatch',{p_portal_id:user.id,p_action:body.action,p_payload:payload});
  if(error)return reply(error.code==='42501'?403:400,{error:'IMS operation refused'});
  return reply(200,{data});
 }catch{return reply(503,{error:'Integration temporarily unavailable'});}
});
