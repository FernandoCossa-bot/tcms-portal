const fs=require("node:fs"), vm=require("node:vm"), assert=require("node:assert/strict"), path=require("node:path");
class Element {
  constructor(tag){this.tag=tag;this.children=[];this.handlers={};this.value="";}
  append(...nodes){this.children.push(...nodes);}
  remove(){this.removed=true;}
  setAttribute(){}
  addEventListener(event,fn){this.handlers[event]=fn;}
  focus(){}
}
function descendants(node){return [node,...node.children.flatMap(descendants)];}
async function setup(role,options){
  const workspace=new Element("section"), summary=new Element("p"), calls=[];
  const client={async rpc(name,args){
    calls.push({name,args});
    if(name==="core_get_access_control")return {data:{access_enabled:true,version:3}};
    if(name==="core_set_global_access")return {data:{access_enabled:false,version:4}};
    return {data:{user_id:"u",display_name:args.p_display_name,platform_role:role}};
  }};
  const context=vm.createContext({document:{createElement:tag=>new Element(tag),querySelector:id=>id==="#workspace"?workspace:summary},window:{confirm:()=>true},client,context:{user_id:"u",display_name:"Fernando",platform_role:role}});
  vm.runInContext(fs.readFileSync(path.join(__dirname,process.argv[2]||"home-tools.js"),"utf8").replaceAll("export function","function").replaceAll("export async function","async function"),context);
  context.options=options;
  await vm.runInContext("showHomeTools(client,context,options)",context);
  return {workspace,summary,calls,context};
}
(async()=>{
  const compact=await setup("system_owner",{platform:false,compact:true});
  assert.equal(compact.calls.length,0);
  assert.equal(compact.workspace.children[0].tag,"details");
  assert.equal(descendants(compact.workspace).filter(x=>x.tag==="textarea").length,0);
  const member=await setup("member");
  assert.equal(member.calls.length,0);
  assert.equal(descendants(member.workspace).filter(x=>x.tag==="textarea").length,0);
  const owner=await setup("system_owner");
  const nodes=descendants(owner.workspace);
  const toggle=nodes.find(x=>x.textContent==="Disable platform access");
  await toggle.handlers.click();
  assert.equal(owner.calls.filter(x=>x.name==="core_set_global_access").length,0);
  nodes.find(x=>x.tag==="textarea").value="Scheduled maintenance";
  await toggle.handlers.click();
  const request=owner.calls.find(x=>x.name==="core_set_global_access");
  assert.equal(request.args.p_enabled,false);
  assert.equal(request.args.p_expected_version,3);
  const form=nodes.find(x=>x.tag==="form");
  nodes.find(x=>x.tag==="input").value="Fernando Cossa";
  await form.handlers.submit({preventDefault(){}});
  assert.match(owner.summary.textContent,/Fernando Cossa/);
  await vm.runInContext("clearHomeTools()",owner.context);
  assert.equal(owner.workspace.children[0].removed,true);
  console.log("PASS: owner-only switch, reason required, version passed, own name update and cleanup.");
})().catch(e=>{console.error(e);process.exitCode=1;});
