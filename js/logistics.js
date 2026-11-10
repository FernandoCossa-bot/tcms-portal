import {node,rawNode,field,setMessage,uiText} from './modules.js?v=20261111-original';
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
// Original Item Movement dashboard; Portal identity and server authorization adapter.
export async function showLogistics(client,root,active,transportAllowed=false){
 const message=node('p','Checking inventory access…');message.setAttribute('role','status');root.append(message);
 const access=await logisticsRequest(client,'access');if(!active())return;
 if(access.allowed!==true){message.textContent='Inventory access is not assigned.';renderLogisticsRequest(root,client,access,active);return;}
 root.append(document.querySelector('#original-dashboard').content.cloneNode(true));
 const $=id=>root.querySelector('#'+id);
 const request=(action,payload={})=>logisticsRequest(client,action,payload);
 $('logout-btn').addEventListener('click',()=>document.querySelector('#sign-out').click());
 let busy=false,accounts=[];
 $('user-role-display').textContent=access.role+' (L'+access.level+')';
 $('user-role-display').setAttribute('data-user-content','');
 $('forms-container').classList.toggle('hidden',access.level<2);
 $('admin-panel').classList.toggle('hidden',access.level<4);
 $('th-action').classList.toggle('hidden',access.level<3);
 if(transportAllowed){const a=node('a','Open transportation');a.href='./transport.html';root.prepend(a);}
 const row=(target,values)=>{const tr=document.createElement('tr');for(const value of values){const td=document.createElement('td');if(typeof value==='object')td.append(value);else {td.textContent=String(value??'');td.setAttribute('data-user-content','');}tr.append(td);}target.append(tr);};
 const button=(label,job)=>{const b=node('button',label);b.type='button';b.addEventListener('click',()=>run(job));return b;};
 const run=async job=>{if(busy||!active())return;busy=true;root.setAttribute('aria-busy','true');root.querySelectorAll('button').forEach(b=>b.disabled=true);try{await job();}catch(e){if(active()){setMessage(message,'{error} Refresh before retrying an uncertain save.',{error:e.message},['error']);if(e.message==='This operation is not permitted.'){ $('dashboard-section').classList.add('hidden');}}}finally{busy=false;if(active()){root.removeAttribute('aria-busy');root.querySelectorAll('button').forEach(b=>b.disabled=false);}}};
 async function refresh(){
  const [items,movements]=await Promise.all([request('stock'),request('movements')]);if(!active())return;
  $('stock-tbody').replaceChildren();$('movement-tbody').replaceChildren();$('movement-item').replaceChildren();
  const empty=node('option','-- Choose Item --');empty.value='';$('movement-item').append(empty);
  for(const item of items){row($('stock-tbody'),[item.name,item.current_stock]);const opt=rawNode('option',item.name);opt.value=item.id;$('movement-item').append(opt);}
  $('total-items-count').textContent=items.length;$('total-movements-count').textContent=movements.length;
  for(const m of movements){const cells=[new Date(m.movement_date).toLocaleString(),m.item_name,m.movement_type,m.quantity];
   if(access.level>=3)cells.push(button('Edit',async()=>{
    const value=window.prompt(uiText('Enter new quantity:'),String(m.quantity));if(value===null)return;
    const quantity=Number(value);if(!Number.isInteger(quantity)||quantity<1||quantity>2147483647)throw Error(uiText('Enter a positive whole number.'));
    await request('edit_movement',{id:m.id,quantity,previous_quantity:m.quantity});if(!active())return;await refresh();message.textContent='Movement saved.';
   }));row($('movement-tbody'),cells);
  }
  if(access.level>=4)await refreshAccess();
 }
 async function refreshAccess(){
  const [rows,history]=await Promise.all([request('queue'),request('audit')]);if(!active())return;accounts=rows;
  $('accounts-tbody').replaceChildren();$('history-tbody').replaceChildren();$('target-user').replaceChildren();
  const empty=node('option','-- Choose account --');empty.value='';$('target-user').append(empty);
  for(const a of accounts){
   const actions=document.createElement('span');
   if(a.protected_owner)actions.append(node('span','Protected System Owner'));
   else {const opt=rawNode('option',a.display_name+' · '+a.status);opt.value=a.portal_id;$('target-user').append(opt);actions.append(button('Review access',async()=>{$('target-user').value=a.portal_id;$('target-role').value=a.role_code||'VIEWER';$('target-decision').value='approved';$('target-user').focus();}));}
   row($('accounts-tbody'),[a.display_name,(a.role_code||'—')+' · '+a.status,actions]);
  }
  for(const h of history)row($('history-tbody'),[accounts.find(a=>a.portal_id===h.target)?.display_name||h.target||'—',h.action,new Date(h.created_at).toLocaleString()]);
 }
 $('item-form').addEventListener('submit',e=>{e.preventDefault();run(async()=>{
  await request('add_item',{name:$('item-name').value.trim()});if(!active())return;$('item-form').reset();await refresh();message.textContent='Item saved.';
 });});
 $('movement-form').addEventListener('submit',e=>{e.preventDefault();run(async()=>{
  await request('add_movement',{item_id:Number($('movement-item').value),movement_type:$('movement-type').value,quantity:Number($('movement-quantity').value)});if(!active())return;$('movement-form').reset();await refresh();message.textContent='Movement saved.';
 });});
 $('assign-role-form').addEventListener('submit',e=>{e.preventDefault();run(async()=>{
  const a=accounts.find(a=>a.portal_id===$('target-user').value);if(!a||a.protected_owner)throw Error('This operation is not permitted.');
  if(!window.confirm(uiText('Save inventory access for {name}?',{name:a.display_name})))return;
  await request('decide',{portal_id:a.portal_id,version:a.version,status:$('target-decision').value,role:$('target-role').value,reason:$('target-reason').value.trim()});if(!active())return;$('assign-role-form').reset();await refreshAccess();message.textContent='Access decision saved.';
 });});
 await run(async()=>{await refresh();if(active())message.textContent='';});
}
