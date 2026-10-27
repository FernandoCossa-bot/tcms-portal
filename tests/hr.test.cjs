const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
class El{constructor(tag){this.tag=tag;this.children=[];this.elements={};this.events={};this.value='';}append(...v){this.children.push(...v);for(const x of v)if(x.name)this.elements[x.name]=x;}replaceChildren(){this.children=[];}setAttribute(){}addEventListener(k,fn){this.events[k]=fn;}reset(){Object.values(this.elements).forEach(x=>x.value='');}}
const root=new El('div'),calls=[];
const client={rpc:async(name,payload)=>{calls.push({name,payload});return {data:[]};},functions:{invoke:async(name,{body})=>{calls.push({name,body});return {data:{created:true,user_id:'new-user'}};}}};
const ctx=vm.createContext({document:{querySelector:()=>root},crypto:{randomUUID:()=> 'test-request-id'},node:(tag,text)=>Object.assign(new El(tag),{textContent:text}),field:(form,name,label,opts)=>{const el=Object.assign(new El('input'),{name},opts);form.append(el);return el;}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/hr.js'),'utf8').replace(/^import.*\n/,'').replaceAll('export function','function').replaceAll('export async function','async function'),ctx);
ctx.client=client;
(async()=>{
 await vm.runInContext('showHR(client)',ctx);
 const form=root.children[0];
 assert.deepEqual(Object.keys(form.elements),['name','email','department','position','password','confirm']);
 Object.assign(form.elements.name,{value:'Test User'});form.elements.email.value='test@example.invalid';form.elements.department.value='Education';form.elements.position.value='Teacher';form.elements.password.value='temporary-example-only';form.elements.confirm.value='mismatch';
 await form.events.submit({preventDefault(){}});assert.equal(calls.filter(x=>x.name==='hr-create-account').length,0);
 form.elements.confirm.value=form.elements.password.value;await form.events.submit({preventDefault(){}});
 const call=calls.find(x=>x.name==='hr-create-account');assert.ok(call);assert.equal(call.body.department,'Education');assert.equal('role' in call.body,false);assert.equal('user_id' in call.body,false);assert.equal(form.elements.password.value,'');
 vm.runInContext('clearHR()',ctx);assert.equal(root.children.length,0);
 console.log('PASS: HR form validates matching passwords, uses protected endpoint, cannot submit roles, clears credentials and sensitive content.');
})().catch(e=>{console.error(e);process.exitCode=1;});
