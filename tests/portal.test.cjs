const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
class Element { constructor(tag){this.tag=tag;this.children=[];} append(...v){this.children.push(...v);} setAttribute(){} }
const ctx=vm.createContext({document:{createElement:t=>new Element(t)}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/modules.js'),'utf8').replaceAll('export const','const').replaceAll('export async function','async function').replaceAll('export function','function'),ctx);
ctx.catalog=['foundation','education','farm','logistics'].map(code=>({code,name:code,description:code,integration_status:code==='logistics'?'transport_available':'pending'}));
for(const role of ['system_owner','restricted_admin','member']) for(const view of [true,false]){
 ctx.target=new Element('div');ctx.permissions={view};ctx.context={platform_role:role};
 vm.runInContext('renderPortal(target,permissions,context,catalog)',ctx);
 assert.equal(ctx.target.children.length,role==='system_owner'?5:4);
 const urls=ctx.target.children.filter(e=>e.tag==='a').map(e=>e.href);
 assert.equal(urls.includes('./transport.html'),view);
 assert.equal(urls.includes('./users.html'),role==='system_owner');
 assert.equal(urls.some(u=>/^https:/.test(u)),false);
}
console.log('PASS: four modules for every account, owner-only administration, transport permission retained, pending integrations not linked.');
