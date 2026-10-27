import {node,field} from './modules.js';
let epoch=0,root;
export function clearHR(){epoch++;root?.replaceChildren();}
export async function showHR(client){
 clearHR(); root=document.querySelector('#hr-content'); const current=epoch;
 const status=node('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const form=node('form');form.id='hr-create';
 form.append(node('h2','Create an account'),node('p','Verify the employee’s identity and email. Deliver the temporary password directly to them; they must replace it on first sign-in.'));
 field(form,'name','Full name',{required:true,minLength:2,maxLength:120});
 field(form,'email','Work email',{type:'email',required:true,maxLength:254});
 field(form,'department','Department',{required:true,maxLength:120});
 field(form,'position','Position',{required:true,maxLength:120});
 const password=field(form,'password','Temporary password (12–128 characters)',{type:'password',required:true,minLength:12,maxLength:128});password.autocomplete='new-password';
 const confirm=field(form,'confirm','Confirm temporary password',{type:'password',required:true,minLength:12,maxLength:128});confirm.autocomplete='new-password';
 const save=node('button','Create account');save.type='submit';form.append(save);
 const list=node('div'), controls=node('div'), back=node('button','Previous'),next=node('button','Next'),refresh=node('button','Refresh directory');
 controls.append(back,next,refresh);root.append(form,status,node('h2','Employee directory'),controls,list);
 let offset=0,busy=false,requestId=crypto.randomUUID(),fingerprint='';
 const message=error=>error?.code==='42501'?'HR access is no longer available. Select Check access.':error?.code==='40001'?'This record changed. Refresh before editing.':'The operation could not be confirmed. Refresh before retrying.';
 async function load(){
  back.disabled=next.disabled=refresh.disabled=true;list.replaceChildren();
  const {data,error}=await client.rpc('core_hr_directory',{p_offset:offset});
  if(current!==epoch)return;
  if(error || !Array.isArray(data)){status.textContent=message(error);refresh.disabled=false;return;}
  for(const employee of data.slice(0,20)){
   const card=node('article');card.append(node('h3',employee.display_name || employee.email),node('p',employee.email),node('p',`Account: ${employee.account_status}`));list.append(card);
   if(employee.protected){card.append(node('p',`${employee.department || '—'} · ${employee.position || '—'}`),node('p','Protected administrative account.'));continue;}
   const edit=node('form');edit.id=`employee-${employee.user_id}`;
   field(edit,'name','Full name',{value:employee.display_name,required:true,minLength:2,maxLength:120});
   field(edit,'department','Department',{value:employee.department,required:true,maxLength:120});
   field(edit,'position','Position',{value:employee.position,required:true,maxLength:120});
   const update=node('button','Save employee details');update.type='submit';edit.append(update);card.append(edit);
   edit.addEventListener('submit',async e=>{e.preventDefault();if(busy||current!==epoch)return;busy=true;update.disabled=true;
    try {const {data,error}=await client.rpc('core_hr_update_employee',{p_user_id:employee.user_id,p_name:edit.elements.name.value.trim(),p_department:edit.elements.department.value.trim(),p_position:edit.elements.position.value.trim(),p_version:employee.version});
     if(current!==epoch)return;if(error||data?.saved!==true)throw error;await load();status.textContent='Employee details saved.';
    }catch(error){if(current===epoch)status.textContent=message(error);}finally{busy=false;if(current===epoch)update.disabled=false;}
   });
  }
  back.disabled=offset===0;next.disabled=data.length<=20;refresh.disabled=false;
 }
 form.addEventListener('submit',async e=>{
  e.preventDefault();if(busy||current!==epoch)return;
  if(password.value!==confirm.value){status.textContent='The temporary passwords do not match.';return;}
  const details={email:form.elements.email.value.trim(),name:form.elements.name.value.trim(),department:form.elements.department.value.trim(),position:form.elements.position.value.trim()};
  const nextFingerprint=JSON.stringify(details);if(nextFingerprint!==fingerprint){requestId=crypto.randomUUID();fingerprint=nextFingerprint;}
  busy=true;save.disabled=true;status.textContent='Creating account…';
  try{
   const {data,error}=await client.functions.invoke('hr-create-account',{body:{...details,id:requestId,password:password.value}});
   if(current!==epoch)return;
   if(error||data?.created!==true)throw error;
   form.reset();requestId=crypto.randomUUID();fingerprint='';offset=0;await load();
   status.textContent='Account created. The employee must change the temporary password on first sign-in. No business-module access was assigned.';
  }catch(error){if(current===epoch)status.textContent='Creation could not be confirmed. Refresh the directory before retrying. Check the email and your permissions.';}
  finally{busy=false;if(current===epoch){save.disabled=false;password.value='';confirm.value='';}}
 });
 back.addEventListener('click',()=>{if(!busy){offset=Math.max(0,offset-20);void load();}});
 next.addEventListener('click',()=>{if(!busy){offset+=20;void load();}});
 refresh.addEventListener('click',()=>{if(!busy)void load();});
 await load();
}
