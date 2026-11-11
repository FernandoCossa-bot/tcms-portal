import {node,rawNode,field,setMessage,uiText} from './modules.js?v=20261111-native';
const endpoint='https://nxrgqzeoylialaiplfxp.supabase.co/functions/v1/portal-bridge';
export async function logisticsRequest(client,action,payload={}){
 const {data:{session}}=await client.auth.getSession();
 if(!session)throw Error('Sign in required.');
 const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({action,payload}),cache:'no-store'});
 let result;try{result=await response.json();}catch{throw Error('Logistics is temporarily unavailable.');}
 if(!response.ok)throw Error(response.status===403?'This operation is not permitted.':result.error||'Logistics is temporarily unavailable.');
 return result.data;
}
export function renderLogisticsRequest(root,client,access,active){
 const panel=node('section');panel.className='tool-card';panel.append(node('h2','Inventory access'));
 const status=node('p');status.setAttribute('role','status');panel.append(status);root.append(panel);
 if(!access){status.textContent='Logistics is temporarily unavailable.';return;}
 if(access.status!=='not_requested'){setMessage(status,'Access status: {status}',{status:access.status},['status']);return;}
 const form=node('form');form.id='inventory-access-request';
 const reason=field(form,'reason','Reason for access',{required:true,minLength:5,maxLength:500});
 const save=node('button','Request inventory access');save.type='submit';form.append(save);panel.append(form);
 let busy=false;form.addEventListener('submit',async e=>{e.preventDefault();if(busy||!active())return;busy=true;save.disabled=true;
  try{await logisticsRequest(client,'request_access',{reason:reason.value.trim()});if(active()){form.remove();status.textContent='Access request submitted. Wait for the module administrator.';}}
  catch(e){if(active())setMessage(status,'{error}',{error:e.message},['error']);}
  finally{busy=false;save.disabled=false;}
 });
}
