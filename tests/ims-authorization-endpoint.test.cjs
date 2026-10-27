const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{stripTypeScriptTypes}=require('node:module');
let handler,valid=true,allowed=true,lastCall;
const caller={auth:{getUser:async()=>valid?{data:{user:{id:'real-portal-id',email:'test@example.invalid'}}}:{error:{},data:{}}},rpc:async()=>({data:{user_id:'real-portal-id',can_enter:allowed,display_name:'Verified Portal name'}})};
const moduleClient={rpc:async(fn,p)=>{lastCall={fn,p};return{data:{status:'pending'}};}};
const ctx=vm.createContext({Request,Response,Set,JSON,Deno:{env:{get:k=>k},serve:f=>handler=f},createClient:(_url,key)=>key==='SUPABASE_SERVICE_ROLE_KEY'?moduleClient:caller});
const file=process.argv[2]||__dirname+'/../supabase/functions/ims-portal-bridge/index.ts';vm.runInContext(stripTypeScriptTypes(fs.readFileSync(file,'utf8').replace(/^import.*\n/,'')),ctx);
const req=(action,payload={})=>new Request('https://test.invalid',{method:'POST',headers:{Authorization:'Bearer token'},body:JSON.stringify({action,payload})});
(async()=>{
 valid=false;assert.equal((await handler(req('request_access'))).status,401);valid=true;
 allowed=false;assert.equal((await handler(req('request_access'))).status,403);allowed=true;
 assert.equal((await handler(req('request_access',{reason:'Need module access',p_actor:'spoofed',verified_label:'Forged identity',role_code:'administrator'}))).status,200);
 assert.equal(lastCall.p.p_actor,'real-portal-id');assert.equal(lastCall.p.p_payload.verified_label,'Verified Portal name');assert.equal(lastCall.p.p_payload.role_code,undefined);
 assert.equal((await handler(req('access_decide',{user_id:'target',p_actor:'spoofed',role_code:'operator',status:'approved'}))).status,200);
 assert.equal(lastCall.p.p_actor,'real-portal-id');assert.equal(lastCall.fn,'ims_portal_access');
 assert.equal((await handler(req('access'))).status,200);
 console.log('PASS: invalid/blocked Portal sessions denied; verified actor and label override user input; role approval always reaches the IMS authorization function.');
})().catch(e=>{console.error(e);process.exitCode=1;});
