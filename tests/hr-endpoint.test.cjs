const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{stripTypeScriptTypes}=require('node:module');
const source=fs.readFileSync(process.argv[2],'utf8').replace(/^import.*\n/,'');
let handler,valid=true,allowed=true,adminCalls=0,payload;
const caller={auth:{getUser:async()=>valid?{data:{user:{id:'actor'}}}:{error:{},data:{}}},rpc:async()=>allowed?{data:{created:false,provisioning_token:"server-capability"}}:{error:{code:'42501'}}};
const admin={auth:{admin:{createUser:async p=>{adminCalls++;payload=p;return{data:{user:{id:'created'}}};}}}};
const context=vm.createContext({Request,Response,Set,JSON,Deno:{env:{get:key=>key},serve:fn=>handler=fn},createClient:(_url,key)=>key==='SUPABASE_SERVICE_ROLE_KEY'?admin:caller});
vm.runInContext(stripTypeScriptTypes(source),context);
const request=(headers={},body={})=>new Request('https://example.invalid',{method:'POST',headers,body:JSON.stringify(body)});
(async()=>{
 assert.equal((await handler(request())).status,401);
 valid=false;assert.equal((await handler(request({Authorization:'Bearer invalid'}))).status,401);
 valid=true;allowed=false;const body={id:'request',email:'test@example.invalid',name:'Test',department:'HR',position:'Staff',password:'temporary-testing-only',role:'system_owner'};
 assert.equal((await handler(request({Authorization:'Bearer valid'},body))).status,403);assert.equal(adminCalls,0);
 allowed=true;assert.equal((await handler(request({Authorization:'Bearer valid',Origin:'https://evil.invalid'},body))).status,403);
 assert.equal((await handler(request({Authorization:'Bearer valid'},body))).status,201);assert.equal(adminCalls,1);
 assert.equal(payload.app_metadata.tcms_request_id,'request');assert.equal('role' in payload.app_metadata,false);assert.equal(payload.user_metadata.tcms_provisioning_token,'server-capability');assert.equal('role' in payload.user_metadata,false);
 console.log('PASS: endpoint rejects missing/invalid sessions, non-HR and foreign origins; ignores role injection; calls Admin Auth only after authorization.');
})().catch(e=>{console.error(e);process.exitCode=1;});
