const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const repo=process.argv[2]||'.';
const html=fs.readFileSync(repo+'/logistics.html','utf8');
class E{
 constructor(tag='div'){this.tag=tag;this.children=[];this.events={};this.attrs={};this.value='';this.hidden=false;this.classes=new Set();this.classList={toggle:(c,on)=>on?this.classes.add(c):this.classes.delete(c),add:c=>this.classes.add(c)};}
 append(...c){this.children.push(...c);}prepend(...c){this.children.unshift(...c);}replaceChildren(...c){this.children=c;}
 setAttribute(k,v){this.attrs[k]=v;}removeAttribute(k){delete this.attrs[k];}addEventListener(k,v){this.events[k]=v;}reset(){}focus(){}
 querySelector(sel){return elements[sel.slice(1)];}querySelectorAll(){return [];}
}
let elements;
async function scenario(level){
 elements=Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],new E()]));
 elements['original-dashboard'].content={cloneNode:()=>new E()};
 const calls=[],root=new E(),ctx=vm.createContext({document:{querySelector:s=>elements[s.slice(1)],createElement:t=>new E(t)},window:{confirm:()=>true,prompt:()=> '7'},console,Number,Date,
 node:(t,s)=>Object.assign(new E(t),{textContent:s}),rawNode:(t,s)=>Object.assign(new E(t),{textContent:s}),setMessage:(e,s)=>e.textContent=s,uiText:s=>s,renderLogisticsRequest:()=>calls.push('request-ui'),
 logisticsRequest:async(c,a,p)=>{calls.push([a,p]);if(a==='access')return {allowed:level>0,level,role:'TEST'};if(a==='stock')return [{id:1,name:'<img src=x onerror=alert(1)>',current_stock:4}];if(a==='movements')return [{id:2,item_id:1,item_name:'Paper',movement_type:'IN',quantity:4,movement_date:'2026-11-11T00:00:00Z'}];if(a==='queue')return [{portal_id:'owner',display_name:'Owner',protected_owner:true,status:'approved',role_code:'ADMIN'},{portal_id:'member',display_name:'Member',status:'pending',version:1}];if(a==='audit')return [];return {};}});
 vm.runInContext(fs.readFileSync(repo+'/js/logistics.js','utf8').split('// Original Item Movement dashboard;')[1].replace(/^[^\n]*\n/,'').replace('export async function','async function'),ctx);
 ctx.root=root;await vm.runInContext('showLogistics({},root,()=>true)',ctx);
 if(level===0){assert(!calls.some(c=>c[0]==='stock'));assert(calls.includes('request-ui'));return;}
 assert.equal(elements['forms-container'].classes.has('hidden'),level<2);
 assert.equal(elements['admin-panel'].classes.has('hidden'),level<4);
 assert.equal(elements['th-action'].classes.has('hidden'),level<3);
 assert.equal(calls.some(c=>c[0]==='queue'),level>=4);
 assert.equal(elements['stock-tbody'].children[0].children[0].textContent,'<img src=x onerror=alert(1)>');
 assert.equal(elements['movement-tbody'].children[0].children.length,level>=3?5:4);
 if(level>=2){elements['item-name'].value='Test';elements['item-form'].events.submit({preventDefault(){}});await new Promise(r=>setImmediate(r));assert(calls.some(c=>c[0]==='add_item'&&c[1].name==='Test'));}
 if(level>=3){const b=elements['movement-tbody'].children[0].children[4].children[0];b.events.click();await new Promise(r=>setImmediate(r));assert(calls.some(c=>c[0]==='edit_movement'&&c[1].previous_quantity===4&&c[1].quantity===7));}
 if(level===4){assert.equal(elements['target-user'].children.length,2);elements['target-user'].value='member';elements['target-role'].value='OPERATOR';elements['target-decision'].value='approved';elements['target-reason'].value='Test approval';elements['assign-role-form'].events.submit({preventDefault(){}});await new Promise(r=>setImmediate(r));assert(calls.some(c=>c[0]==='decide'&&c[1].version===1&&c[1].portal_id==='member'));}
}
(async()=>{for(const level of [0,1,2,3,4])await scenario(level);assert(!html.includes('css/styles.css'));assert(html.includes('original-dashboard'));console.log('PASS: original dashboard denies unassigned accounts; Viewer/Operator/Manager/Admin controls; text-safe records; item writes, conflict-aware quantity edits, versioned approvals and protected Owner exclusion.');})().catch(e=>{console.error(e);process.exitCode=1});

