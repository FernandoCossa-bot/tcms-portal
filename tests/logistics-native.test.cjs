const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=process.argv[2]||path.resolve(__dirname,'..');
const mapping=fs.readFileSync(path.join(root,'js/logistics-native-rpc.js'),'utf8').replace('export async function','async function');
const source=fs.readFileSync(path.join(root,'js/module-launch.js'),'utf8').replace(/^import .*;\r?\n/gm,'');
(async()=>{
 let calls=[],listener,open,allowed=true,posted=[],userId='u';
 const child={postMessage:(data,origin)=>posted.push({data,origin})};const status={};const button={addEventListener:(n,f)=>open=f};
 const ctx=vm.createContext({console,URL,Error,JSON,document:{querySelector:s=>s==='#launch-status'?status:button},window:{addEventListener:(n,f)=>listener=f,open:()=>child},SUPABASE_URL:'portal',SUPABASE_PUBLISHABLE_KEY:'public',createClient:()=>({auth:{getSession:async()=>({data:{session:{access_token:'DO-NOT-LEAK',refresh_token:'NEVER-SEND',user:{id:userId,email:'u@example.invalid'}}}})},rpc:async()=>({data:{user_id:'u',can_enter:allowed}})}),fetch:async(url,opts)=>{const body=JSON.parse(opts.body);calls.push(body);let data={allowed:true,level:4,role:'ADMIN'};if(body.action==='stock')data=[{id:1,name:'Paper'}];if(body.action==='queue')data=[{portal_id:'target',email:'test@example.invalid',version:3,role_code:'VIEWER'}];return {ok:true,json:async()=>({data})};}});
 vm.runInContext(mapping+'\n'+source,ctx);await new Promise(r=>setImmediate(r));open();calls=[];
 await listener({origin:'https://evil.invalid',source:child,data:{channel:'tcms-item-movement-v1',id:'1',method:'session'}});assert.equal(posted.length,0);
 await listener({origin:'https://adrianochivulele01.github.io',source:{},data:{channel:'tcms-item-movement-v1',id:'1',method:'session'}});assert.equal(posted.length,0);
 const message=(id,method,params)=>listener({origin:'https://adrianochivulele01.github.io',source:child,data:{channel:'tcms-item-movement-v1',id,method,params}});
 await message('2','session');assert.equal(posted[0].data.data.user.id,'u');assert(!JSON.stringify(posted).includes('DO-NOT-LEAK'));assert(!JSON.stringify(posted).includes('NEVER-SEND'));
 await message('3','rpc',{name:'list_items'});assert.equal(posted.at(-1).data.data[0].name,'Paper');
 await message('4','rpc',{name:'assign_role',args:{p_email:'TEST@example.invalid',p_role_code:'OPERATOR'}});assert.equal(calls.at(-1).action,'decide');assert.equal(calls.at(-1).payload.portal_id,'target');assert.equal(calls.at(-1).payload.version,3);
 await message('5','rpc',{name:'update_movement',args:{p_id:1,p_quantity:8,p_previous_quantity:4}});assert.equal(calls.at(-1).payload.previous_quantity,4);
 const count=calls.length;await message('6','rpc',{name:'arbitrary_sql'});assert.equal(calls.length,count);assert(posted.at(-1).data.error);
 allowed=false;await message('7','rpc',{name:'list_items'});assert(posted.at(-1).data.denied);assert.equal(calls.length,count);
 allowed=true;userId='other-user';await message('8','rpc',{name:'list_items'});assert(posted.at(-1).data.denied);assert.equal(calls.length,count);
 console.log('PASS: native module RPC mapping, versioned decisions, edit conflicts, exact origin/window checks, no token disclosure, unsupported operations and disabled Portal accounts refused.');
})().catch(e=>{console.error(e);process.exitCode=1});

