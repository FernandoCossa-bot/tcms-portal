import { createClient } from 'npm:@supabase/supabase-js@2.117.2';

const origins = new Set(['https://fernandocossa-bot.github.io', 'http://127.0.0.1:5500', 'http://localhost:5500']);
Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  const headers: Record<string,string> = {'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin'};
  if (origin && origins.has(origin)) {
    headers['Access-Control-Allow-Origin']=origin;
    headers['Access-Control-Allow-Headers']='authorization, x-client-info, apikey, content-type';
    headers['Access-Control-Allow-Methods']='POST, OPTIONS';
  }
  const reply=(status:number, body:unknown)=>new Response(JSON.stringify(body),{status,headers});
  if(origin && !origins.has(origin)) return reply(403,{error:'Origin not allowed'});
  if(req.method==='OPTIONS') return new Response(null,{status:204,headers});
  if(req.method!=='POST') return reply(405,{error:'Method not allowed'});
  const authorization=req.headers.get('authorization') || '';
  if(!authorization.startsWith('Bearer ')) return reply(401,{error:'Sign in required'});
  try {
    const url=Deno.env.get('SUPABASE_URL')!;
    const caller=createClient(url,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:authorization}},auth:{persistSession:false,autoRefreshToken:false}});
    // Verify with Auth, then check current DB authorization; never trust client metadata.
    const identity=await caller.auth.getUser(authorization.slice(7));
    if(identity.error || !identity.data.user) return reply(401,{error:'Invalid session'});
    const raw=await req.text();
    if(raw.length>4096) return reply(400,{error:'Request too large'});
    const b=JSON.parse(raw);
    if(typeof b.password!=='string' || b.password.length<12 || b.password.length>128 || typeof b.id!=='string') return reply(400,{error:'Use a temporary password of 12–128 characters.'});
    const {data:ticket,error}=await caller.rpc('core_hr_prepare_account',{p_id:b.id,p_email:b.email,p_display_name:b.name,p_department:b.department,p_position:b.position});
    if(error) return reply(error.code==='42501'?403:400,{error:error.code==='42501'?'HR access required':'Check the details, request identifier and hourly limit.'});
    if(ticket?.created===true) return reply(200,{created:true,user_id:ticket.user_id});
    const admin=createClient(url,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
    // A random, short-lived, single-use provisioning capability, NOT a role claim.
    const result=await admin.auth.admin.createUser({email:b.email.trim().toLowerCase(),password:b.password,email_confirm:true,app_metadata:{tcms_request_id:b.id},user_metadata:{tcms_provisioning_token:ticket.provisioning_token}});
    if(result.error) return reply(409,{error:'Account creation could not be confirmed. Check the directory before retrying; the email may already exist.'});
    return reply(201,{created:true,user_id:result.data.user.id});
  } catch {
    return reply(400,{error:'Unable to process account creation. Check the directory before retrying.'});
  }
});
