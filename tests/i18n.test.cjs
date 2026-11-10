const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'js/ui.js'),'utf8').replaceAll('\r\n','\n');
const dictionary=JSON.parse(source.slice(source.indexOf('const dictionary=')+17,source.indexOf(';\n  const t=')));
class El {
 constructor(tag){this.tag=tag;this.children=[];this.attributes={};this.textContent='';this.value='';}
 setAttribute(k,v){this.attributes[k]=v;}
 removeAttribute(k){delete this.attributes[k];}
 append(...nodes){this.children.push(...nodes);}
}
for(const language of ['en','pt','zh-Hant']){
 const ctx=vm.createContext({localStorage:{getItem:k=>k==='tcms-language'?language:'dark'},matchMedia:()=>({matches:true,addEventListener(){}}),document:{documentElement:{dataset:{}},addEventListener(){},createElement:tag=>new El(tag)}});
 vm.runInContext(source,ctx);
 vm.runInContext(fs.readFileSync(path.join(root,'js/modules.js'),'utf8').replaceAll('export const','const').replaceAll('export async function','async function').replaceAll('export function','function'),ctx);
 const api=ctx.TCMSI18n;
 for(const [key,values] of Object.entries(dictionary)){
  assert.equal(values.length,2);for(const value of values){assert.ok(value.trim());assert.deepEqual([...value.matchAll(/\{(\w+)\}/g)].map(m=>m[1]).sort(),[...key.matchAll(/\{(\w+)\}/g)].map(m=>m[1]).sort(),key);}
 }
 const raw='<img src=x onerror=alert(1)> Save {role}';
 const result=api.t('Objectives: {text}',{text:raw});assert.ok(result.endsWith(raw),'User content must not be interpreted or translated');
 ctx.result=new El('p');ctx.name=raw;
 vm.runInContext('setMessage(result,"{name} · {role}",{name,role:"operator"},["role"])',ctx);
 assert.ok(ctx.result.textContent.startsWith(raw));assert.equal(ctx.result.children.length,0);
 assert.ok(ctx.result.textContent.endsWith(api.t('operator')));
 ctx.result.textContent='New status';api.renderMessage(ctx.result);assert.equal(ctx.result.textContent,'New status');assert.equal(ctx.result.tcmsMessage,undefined,'Stale message must never overwrite later status');
 ctx.form=new El('form');ctx.form.id='status-test';
 vm.runInContext('field(form,"status","Status",{value:"approved",choices:[["planned","planned"],["approved","approved"]]})',ctx);
 const select=ctx.form.children[1];assert.equal(select.value,'approved');assert.deepEqual(select.children.map(o=>o.value),['planned','approved']);
 const person=vm.runInContext('rawNode("h3","Save")',ctx);assert.equal(person.textContent,'Save');assert.ok('data-user-content' in person.attributes);
 const message=vm.runInContext('node("p",{key:"Status: {status}",values:{status:"approved"},labels:["status"]})',ctx);
 assert.equal(message.textContent,api.t('Status: {status}',{status:'approved'},['status']));
 assert.equal(ctx.document.documentElement.lang,language);
}
console.log('PASS: EN/PT/Traditional Chinese dictionaries, placeholder parity, raw-data isolation, safe text rendering, stale-status cleanup and unchanged option values.');
