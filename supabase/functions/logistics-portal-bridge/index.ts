import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.2';
const portal='https://yvrrfedbaugqfgrvnmar.supabase.co';
const key='sb_publishable_HkGBBomCCo6byp1XYgYKyw_9ARjTTuy';
const origins=new Set(['https://fernandocossa-bot.github.io','http://127.0.0.1:5500','http://localhost:5500']);
const actions=new Set(['access','request_access','queue','decide','audit','stock','movements','add_item','add_movement','edit_movement']);
Deno.serve(async req=>{
 const origin=req.headers.get('origin')||'';
 const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin',...(origins.has(origin)?{'Access-Control-Allow-Origin':origin}:{}),'Access-Control-Allow-Headers':'authorization,content-type,apikey,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS'};
 const reply=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers});
 if(origin&&!origins.has(origin))return reply(403,{error:'Origin denied'});
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return reply(405,{error:'POST required'});
 const auth=req.headers.get('authorization')||'';
 if(!auth.startsWith('Bearer '))return reply(401,{error:'Sign in required.'});
 try{
  const caller=createClient(portal,key,{global:{headers:{Authorization:auth}},auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error}=await caller.auth.getUser(auth.slice(7));
  if(error||!user)return reply(401,{error:'Invalid session'});
  const {data:context,error:denied}=await caller.rpc('core_get_my_context');
  if(denied||context?.user_id!==user.id||context?.can_enter!==true)return reply(403,{error:'Portal access denied'});
  const raw=await req.text();if(raw.length>10000)return reply(413,{error:'Request too large'});
  let body;try{body=JSON.parse(raw);}catch{return reply(400,{error:'Invalid request'});}
  if(!body||!actions.has(body.action))return reply(400,{error:'Unknown operation'});
  if(body.payload!==undefined&&(!body.payload||typeof body.payload!=='object'||Array.isArray(body.payload)))return reply(400,{error:'Invalid request'});
  const payload=body.payload||{};
  if(body.action==='request_access')payload.verified_label=(context.display_name||user.email||user.id).slice(0,200);
  const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
  const result=await db.rpc('logistics_portal_dispatch',{p_actor:user.id,p_action:body.action,p_payload:payload});
  if(result.error)return reply(result.error.code==='42501'?403:result.error.code==='40001'?409:400,{error:result.error.code==='42501'?'This operation is not permitted.':result.error.code==='40001'?'Record changed. Refresh and review again.':'Check the entered values.'});
  return reply(200,{data:result.data});
 }catch{return reply(503,{error:'Logistics is temporarily unavailable.'});}
});
