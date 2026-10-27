// Preparation only. Never grants access or sends credentials to another project.
export const imsTemplate = Object.freeze({
  contractVersion: '1.0', moduleCode: 'foundation',
  displayName: 'Information Management System',
  projectRef: 'dstzkaygqvxhzmefirdr',
  environment: 'test', testProjectRef: '',
  applicationUrl: '', callbackUrl: '', repositoryUrl: '',
  authentication: 'oidc-pilot-pending',
});
const keys = Object.keys(imsTemplate);
function httpsUrl(value, field, errors) {
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:' || u.username || u.password || u.search || u.hash
      || u.hostname === 'localhost' || !u.hostname.includes('.')
      || /^\d[\d.]*$/.test(u.hostname) || u.hostname.includes(':')) throw Error();
    return u;
  } catch { errors.push(`${field}: use a public HTTPS address without credentials, query parameters or fragments.`); }
}
export function validateIntegration(input) {
  const errors=[];
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {valid:false,errors:['Expected a configuration object.']};
  for(const k of Object.keys(input)) if(!keys.includes(k)) errors.push('Unexpected field. Use only the supplied template; do not include keys or credentials.');
  for(const k of keys) if(typeof input[k] !== 'string' || input[k].length>500) errors.push(`Invalid field: ${k}.`);
  if(errors.length) return {valid:false,errors};
  if(input.contractVersion!=='1.0' || input.moduleCode!=='foundation' || input.displayName!==imsTemplate.displayName) errors.push('Module identity or contract version does not match IMS.');
  if(input.projectRef!==imsTemplate.projectRef) errors.push('The source project does not match the IMS handover.');
  if(input.environment!=='test') errors.push('Only a test environment can be prepared here.');
  if(!/^[a-z]{20}$/.test(input.testProjectRef) || [input.projectRef,'yvrrfedbaugqfgrvnmar'].includes(input.testProjectRef)) errors.push('Provide a separate IMS test project; neither the source IMS nor Portal project is accepted.');
  if(input.authentication!=='oidc-pilot-pending') errors.push('Authentication remains pending until the joint pilot passes.');
  const app=httpsUrl(input.applicationUrl,'Application address',errors);
  const callback=httpsUrl(input.callbackUrl,'Callback address',errors);
  if(app && callback && app.origin!==callback.origin) errors.push('Application and callback must share an origin for this pilot.');
  const repo=httpsUrl(input.repositoryUrl,'Repository address',errors);
  if(repo && (repo.hostname!=='github.com' || !/^\/[^/]+\/[^/]+\/?$/.test(repo.pathname))) errors.push('Provide the GitHub repository address, without a file or branch path.');
  return {valid:errors.length===0,errors};
}
function el(tag,text){const e=document.createElement(tag);if(text)e.textContent=text;return e;}
export function renderIntegrationPreparation(root,context){
  if(context?.platform_role!=='system_owner' || context.can_enter!==true) return;
  const panel=el('section');panel.className='integration-preparation';
  panel.setAttribute('aria-labelledby','integration-heading');
  const title=el('h2','Module integrations');title.id='integration-heading';
  panel.append(title,el('h3',imsTemplate.displayName),
    el('p','Activity access is connected through the IMS gateway. The configuration form below is for a future full-module authentication pilot.'));
  const list=el('ul');
  for(const text of [
    'Module identity and source Supabase project identified.',
    'Local database checks: 104 passed. Real Supabase login and file operations still need testing.',
    'Module-owned IMS database connected; existing data remains in IMS.',
    'Activity list, creation and editing verified with the System Owner account.',
    'Gateway checks Portal access and IMS approval on every request. Original IMS login remains separate.'
  ])list.append(el('li',text));
  panel.append(list);
  const download=el('button','Download configuration template');download.type='button';
  download.addEventListener('click',()=>{
    const url=URL.createObjectURL(new Blob([JSON.stringify(imsTemplate,null,2)],{type:'application/json'}));
    const a=el('a');a.href=url;a.download='ims-integration-template.json';a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  const label=el('label','Review completed configuration (JSON, maximum 8 KB)');
  const file=el('input');file.type='file';file.accept='.json,application/json';file.id='integration-file';label.htmlFor=file.id;
  const status=el('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  file.addEventListener('change',async()=>{
    const selected=file.files?.[0];status.textContent='';if(!selected)return;
    if(selected.size>8192){status.textContent='File too large. Maximum size is 8 KB.';file.value='';return;}
    try{
      const value=JSON.parse(await selected.text());const result=validateIntegration(value);
      if(root.isConnected===false)return;
      status.textContent=result.valid?'Configuration format accepted. This review has not saved, connected or activated the module.':result.errors.join(' ');
    }catch{status.textContent='Unable to read configuration. Use the supplied JSON template.';}
    finally{file.value='';}
  });
  panel.append(download,label,file,status,el('p','Configuration review runs only in this browser. Files are not uploaded or saved. Never include passwords or secret keys.'));
  root.append(panel);
}
