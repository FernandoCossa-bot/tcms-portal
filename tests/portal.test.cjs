const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
class Element{constructor(tag){this.tag=tag;this.children=[];}append(...items){this.children.push(...items);}setAttribute(){}replaceChildren(...items){this.children=items;}}
const ctx=vm.createContext({document:{createElement:tag=>new Element(tag)}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/modules.js'),'utf8').replaceAll('export const','const').replaceAll('export async function','async function').replaceAll('export function','function'),ctx);
function render(role,view){ctx.target=new Element('div');ctx.permissions={view};ctx.context={platform_role:role};vm.runInContext('renderPortal(target,permissions,context)',ctx);return ctx.target;}
function links(root){return root.children.filter(x=>x.tag==='a').map(x=>x.href);}
assert.deepEqual(links(render('system_owner',true)),['./transport.html','./users.html']);
assert.deepEqual(links(render('restricted_admin',false)),['./users.html']);
assert.deepEqual(links(render('member',true)),['./transport.html']);
assert.deepEqual(links(render('member',false)),[]);
assert.equal(render('member',false).children[0].className,'empty-modules');
const home=fs.readFileSync(path.join(__dirname,'../home.html'),'utf8');
assert.doesNotMatch(home,/Disable platform access|manage-users-link|Warehouse|Procurement/);
const app=fs.readFileSync(path.join(__dirname,'../js/app.js'),'utf8');
assert.match(app,/platform: page === "users", compact: page === "home"/);
assert.match(app,/page === "users" && !administrator/);
console.log('PASS: Owner has exactly two modules; admin/member visibility follows permissions; no future modules or global control on homepage.');
