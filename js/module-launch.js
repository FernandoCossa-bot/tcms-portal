import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from './config.js?v=20261111-native';
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.117.2';
import {nativeLogisticsRpc} from './logistics-native-rpc.js?v=20261111-native';
const client=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
const endpoint='https://nxrgqzeoylialaiplfxp.supabase.co/functions/v1/portal-bridge';
const destination='https://adrianochivulele01.github.io/item-movement-system/?tcms=1';
const origin=new URL(destination).origin,channel='tcms-item-movement-v1';
const status=document.querySelector('#launch-status'),button=document.querySelector('#open-module');
let child=null,inflight=0,boundUser=null;
async function identity(){
 const {data:{session},error}=await client.auth.getSession();if(error||!session){const e=Error('Sign in to the Portal first.');e.denied=true;throw e;}
 if(boundUser&&boundUser!==session.user.id){const e=Error('Portal account changed. Reopen the module from the homepage.');e.denied=true;throw e;}
 boundUser=session.user.id;
 const {data:c,error:e}=await client.rpc('core_get_my_context');
 if(e||c?.user_id!==session.user.id||c.can_enter!==true){const error=Error('Portal access is not available.');error.denied=true;throw error;}
 return session;
}
async function request(action,payload={}){
 const session=await identity();
 const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token},body:JSON.stringify({action,payload}),cache:'no-store'});
 const result=await response.json();if(!response.ok){const error=Error(result.error||'Module access refused.');error.denied=response.status===401||response.status===403;throw error;}return result.data;
}
window.addEventListener('message',async e=>{
 if(!child||e.source!==child||e.origin!==origin||e.data?.channel!==channel||typeof e.data.id!=='string'||e.data.id.length>100)return;
 const id=e.data.id;if(inflight>=12){child.postMessage({channel,id,error:'Too many operations. Retry shortly.'},origin);return;}
 inflight++;
 try{
  let data;if(e.data.method==='session'){const s=await identity();const a=await request('access');if(!a.allowed)throw Error('Inventory access is not assigned.');data={user:{id:s.user.id,email:s.user.email}};}
  else if(e.data.method==='rpc')data=await nativeLogisticsRpc(request,e.data.params?.name,e.data.params?.args);
  else throw Error('Unsupported request.');
  child.postMessage({channel,id,data},origin);
 }catch(error){child.postMessage({channel,id,error:error.message,denied:error.denied===true},origin);status.textContent=error.message;}
 finally{inflight--;}
});
button.addEventListener('click',()=>{
 child=window.open(destination,'tcms-original-logistics');
 status.textContent=child?'The original module is open. Keep this tab open to maintain the Portal connection.':'Allow the module window to open, then try again.';
});
async function start(){try{const a=await request('access');if(!a.allowed)throw Error('Inventory access is not assigned. Request access from the homepage.');button.disabled=false;status.textContent='Open the original Item Movement application.';}catch(e){status.textContent=e.message;}}
start();
