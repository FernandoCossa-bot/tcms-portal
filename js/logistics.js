import {node,rawNode,field,setMessage,uiText} from './modules.js?v=20261110-logistics';
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
export async function showLogistics(client,root,active,transportAllowed=false){
 const title=node('h2','Inventory & Movements');root.append(title);
 if(transportAllowed){const link=node('a','Open transportation');link.href='./transport.html';link.className='button';root.append(link);}
 const message=node('p','Checking inventory access…');message.setAttribute('role','status');root.append(message);
 const access=await logisticsRequest(client,'access');if(!active())return;
 if(access.allowed!==true){message.textContent='Inventory access is not assigned.';renderLogisticsRequest(root,client,access,active);return;}
 setMessage(message,'Inventory role: {role}',{role:access.role},['role']);
 const nav=node('nav');nav.className='ims-tabs';const view=node('section');view.className='ims-view';root.append(nav,view);
 const request=(action,payload={})=>logisticsRequest(client,action,payload);
 let busy=false,epoch=0;
 const run=async job=>{if(busy||!active())return;busy=true;root.setAttribute('aria-busy','true');try{await job();}catch(e){if(active())setMessage(message,'{error} Refresh before retrying an uncertain save.',{error:e.message},['error']);}finally{busy=false;root.setAttribute('aria-busy','false');}};
 const button=(parent,label,job)=>{const b=node('button',label);b.type='button';b.addEventListener('click',()=>run(job));parent.append(b);return b;};
 const section=label=>{epoch++;view.replaceChildren(node('h3',label));return epoch;};
 const form=(label,specs,saveLabel,submit)=>{
  const f=node('form');f.className='ims-form';f.id='inventory-form-'+Math.random().toString(36).slice(2);f.append(node('h3',label));const inputs={};
  for(const [key,text,options]of specs)inputs[key]=field(f,key,text,options);
  const save=node('button',saveLabel);save.type='submit';f.append(save);view.append(f);
  f.addEventListener('submit',e=>{e.preventDefault();run(async()=>{save.disabled=true;try{await submit(Object.fromEntries(Object.entries(inputs).map(([k,v])=>[k,v.value])));}finally{save.disabled=false;}});});return f;
 };
 const table=(headers,rows)=>{const wrap=node('div');wrap.style.overflowX='auto';const t=node('table'),head=node('thead'),hr=node('tr'),body=node('tbody');for(const h of headers){const th=node('th',h);th.scope='col';hr.append(th);}head.append(hr);for(const cells of rows){const tr=node('tr');for(const c of cells){const td=node('td');td.append(c);tr.append(td);}body.append(tr);}t.append(head,body);wrap.append(t);view.append(wrap);};
 async function stock(){const e=section('Current stock');const rows=await request('stock');if(!active()||e!==epoch)return;
  table(['Item','Quantity'],rows.map(r=>[rawNode('span',r.name),rawNode('span',r.current_stock)]));
  if(!rows.length)view.append(node('p','No items yet.'));
  if(access.level>=2)form('Add item',[['name','Item name',{required:true,maxLength:200}]],'Save item',async p=>{await request('add_item',p);await stock();message.textContent='Item saved.';});
 }
 async function movements(){const e=section('Stock movements');const [rows,items]=await Promise.all([request('movements'),request('stock')]);if(!active()||e!==epoch)return;
  view.append(node('p','Showing up to 500 recent movements.'));
  table(['Item','Movement type','Quantity','Date','Actions'],rows.map(r=>{const actions=node('span');if(access.level>=3)button(actions,'Edit',async()=>{section('Correct movement');view.append(rawNode('p',r.item_name));form('Correct quantity',[['quantity','Quantity',{type:'number',required:true,min:1,max:2147483647,step:1,value:r.quantity}]],'Save correction',async p=>{await request('edit_movement',{id:r.id,quantity:Number(p.quantity),previous_quantity:r.quantity});await movements();message.textContent='Movement saved.';});button(view,'Cancel',movements);});return [rawNode('span',r.item_name),node('span',r.movement_type),rawNode('span',r.quantity),rawNode('span',r.movement_date),actions];}));
  if(access.level>=2&&items.length)form('Record movement',[
   ['item_id','Item',{required:true,choices:items.map(i=>[String(i.id),i.name,true])}],
   ['movement_type','Movement type',{required:true,choices:[['IN','IN'],['OUT','OUT']]}],
   ['quantity','Quantity',{type:'number',required:true,min:1,max:2147483647,step:1}]
  ],'Save movement',async p=>{await request('add_movement',{item_id:Number(p.item_id),movement_type:p.movement_type,quantity:Number(p.quantity)});await movements();message.textContent='Movement saved.';});
 }
 async function queue(){const e=section('Inventory access management');const rows=await request('queue');if(!active()||e!==epoch)return;
  for(const r of rows){const card=node('article');card.className='tool-card';card.append(rawNode('h3',r.display_name),rawNode('p',r.reason),node('p',{key:'Access status: {status}',values:{status:r.status},labels:['status']}));view.append(card);
   if(r.protected_owner){card.append(node('p','Protected System Owner'));continue;}
   button(card,'Review access',async()=>{section('Review inventory access');view.append(rawNode('h3',r.display_name));form('Assign module access',[
    ['status','Decision',{choices:[['approved','Approve'],['rejected','Reject'],['revoked','Revoke']]}],
    ['role','Role',{value:r.role_code||'VIEWER',choices:[['VIEWER','Viewer'],['OPERATOR','Operator'],['MANAGER','Manager'],['ADMIN','Administrator']]}],
    ['reason','Reason for change',{required:true,minLength:5,maxLength:500}]
   ],'Save access',async p=>{if(!window.confirm(uiText('Save inventory access for {name}?',{name:r.display_name})))return;await request('decide',{...p,portal_id:r.portal_id,version:r.version});await queue();message.textContent='Access decision saved.';});button(view,'Cancel',queue);});
  }
 }
 async function history(){const e=section('Inventory audit history');const rows=await request('audit');if(!active()||e!==epoch)return;table(['Date','Action','Actor','Target'],rows.map(r=>[rawNode('span',r.created_at),rawNode('span',r.action),rawNode('span',r.actor),rawNode('span',r.target||'')]));}
 button(nav,'Current stock',stock);button(nav,'Stock movements',movements);if(access.level>=4){button(nav,'Manage inventory access',queue);button(nav,'Inventory audit history',history);}
 await run(stock);
}
