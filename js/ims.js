import {node,field} from './modules.js';
const endpoint='https://dstzkaygqvxhzmefirdr.supabase.co/functions/v1/portal-bridge';
export async function imsRequest(client,action,payload={}){
 const {data:{session}}=await client.auth.getSession();
 if(!session)throw Error('Sign in required.');
 const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({action,payload}),cache:'no-store'});
 const body=await response.json();
 if(!response.ok)throw Error(response.status===403?'IMS access is not assigned or is no longer available.':body.error||'IMS is unavailable.');
 return body.data;
}
export async function showIMS(client,root,active){
 const message=node('p','Checking IMS access…');message.setAttribute('role','status');root.append(message);
 try{
  const access=await imsRequest(client,'access');if(!active())return;
  if(access?.allowed!==true){message.textContent='IMS access has not been assigned.';return;}
  const form=node('form');form.id='ims-activity';
  const heading=node('h2','Create an activity');
  const name=field(form,'name','Activity name',{required:true,maxLength:200});
  const date=field(form,'date','Date',{type:'date',required:true});
  const location=field(form,'location','Location',{required:true,maxLength:200});
  const save=node('button','Save activity');save.type='submit';
  const cancel=node('button','Cancel edit');cancel.type='button';cancel.hidden=true;form.append(save,cancel);
  const refresh=node('button','Refresh activities');refresh.type='button';const list=node('div');
  root.append(heading,form,refresh,list);let editing=null,busy=false;
  const reset=()=>{editing=null;form.reset();heading.textContent='Create an activity';cancel.hidden=true;};
  const load=async()=>{
   list.replaceChildren();const rows=await imsRequest(client,'list');if(!active())return;
   for(const row of rows){
    const card=node('article');card.className='integration-preparation';
    card.append(node('h3',row.session_name),node('p',`${row.session_date} · ${row.location||''} · ${row.workflow_status}`));
    if(access.is_admin||row.workflow_status==='planned'){
     const edit=node('button','Edit activity');edit.type='button';edit.addEventListener('click',()=>{
      if(busy)return;editing=row.id;name.value=row.session_name;date.value=row.session_date;location.value=row.location||'';heading.textContent='Edit activity';cancel.hidden=false;name.focus();
     });card.append(edit);
    }list.append(card);
   }message.textContent=rows.length?`${rows.length} activities loaded from IMS.`:'No activities found.';
  };
  cancel.addEventListener('click',()=>{if(!busy)reset();});
  refresh.addEventListener('click',async()=>{if(busy)return;try{await load();}catch(e){list.replaceChildren();message.textContent=e.message;}});
  form.addEventListener('submit',async event=>{
   event.preventDefault();if(busy||!active())return;busy=true;save.disabled=true;
   try{const id=await imsRequest(client,editing?'edit':'create',{id:editing,name:name.value.trim(),date:date.value,location:location.value.trim()});if(!active())return;reset();await load();message.textContent=`Activity ${id} saved in IMS.`;}
   catch(e){if(active())message.textContent=e.message;}
   finally{busy=false;save.disabled=false;}
  });await load();
 }catch(e){if(active()){root.replaceChildren(message);message.textContent=e.message;}}
}
