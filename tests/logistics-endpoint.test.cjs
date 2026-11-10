const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../supabase/functions/logistics-portal-bridge/index.ts'),'utf8')
 .replace(/^import .*;\n/,'').replace('(status:number,body:unknown)','(status,body)').replaceAll("Deno.env.get('SUPABASE_URL')!","Deno.env.get('SUPABASE_URL')").replaceAll("Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!","Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')");
async function test({authError=false,canEnter=true,mismatch=false,payload={},action='stock',dbError=null,authorization='Bearer valid'}={}){
 let handler,calls=[];
 const user={id:'verified-user',email:'verified@example.invalid'};
 const ctx=vm.createContext({Request,Response,Set,JSON,Deno:{env:{get:n=>n},serve:h=>handler=h},createClient:(url)=>url.startsWith('https://yvrr')?{
  auth:{getUser:async()=>({data:{user},error:authError?{}:null})},rpc:async()=>({data:{user_id:mismatch?'other':user.id,can_enter:canEnter,display_name:'Verified Name'}})
 }:{rpc:async(name,args)=>{calls.push({name,args});return {data:{allowed:true},error:dbError};}}});
 vm.runInContext(source,ctx);
 const result=await handler(new Request('https://module.invalid',{method:'POST',headers:{Authorization:authorization,Origin:'https://fernandocossa-bot.github.io'},body:JSON.stringify({action,payload})}));
 return {status:result.status,calls};
}
(async()=>{
 for(const input of [{authError:true},{canEnter:false},{mismatch:true},{authorization:''}]){const r=await test(input);assert.ok([401,403].includes(r.status));assert.equal(r.calls.length,0);}
 let r=await test({action:'stock',payload:{p_actor:'forged',portal_id:'forged',role:'ADMIN'}});assert.equal(r.status,200);assert.equal(r.calls[0].args.p_actor,'verified-user');
 r=await test({action:'request_access',payload:{verified_label:'Forged Name',reason:'Need access'}});assert.equal(r.calls[0].args.p_payload.verified_label,'Verified Name');
 r=await test({action:'arbitrary_sql'});assert.equal(r.status,400);assert.equal(r.calls.length,0);
 r=await test({dbError:{code:'42501'}});assert.equal(r.status,403);
 r=await test({dbError:{code:'40001'}});assert.equal(r.status,409);
 console.log('PASS: Logistics endpoint rejects invalid/blocked/mismatched sessions, derives actor and label server-side, rejects unknown actions, and preserves authorization/conflict errors.');
})().catch(e=>{console.error(e);process.exitCode=1;});
