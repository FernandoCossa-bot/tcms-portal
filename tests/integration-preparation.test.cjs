const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'js/integration-preparation.js'),'utf8');
const ctx=vm.createContext({URL});
vm.runInContext(source.replaceAll('export const','const').replaceAll('export function','function'),ctx);
const template=vm.runInContext('({...imsTemplate})',ctx);
const good={...template,testProjectRef:'abcdefghijklmnopqrst',applicationUrl:'https://ims.example.org/',callbackUrl:'https://ims.example.org/auth/callback',repositoryUrl:'https://github.com/example/ims'};
const check=v=>{ctx.input=v;return vm.runInContext('validateIntegration(input)',ctx)};
assert.equal(check(good).valid,true);
for(const input of [null,[],{},template,{...good,environment:'production'},
 {...good,testProjectRef:template.projectRef},{...good,testProjectRef:'yvrrfedbaugqfgrvnmar'},
 {...good,secret:'value'},{...good,moduleCode:'logistics'},
 {...good,applicationUrl:'javascript:alert(1)'},{...good,applicationUrl:'http://example.org'},
 {...good,applicationUrl:'https://user:password@example.org'},
 {...good,applicationUrl:'https://example.org/?token=abc'},
 {...good,callbackUrl:'https://different.example.org/callback'},
 {...good,repositoryUrl:'https://github.com/example/ims/blob/main/x'},
 {...good,testProjectRef:123}]) assert.equal(check(input).valid,false,JSON.stringify(input));
// No DOM needed for rejected callers: must exit before creating elements.
for(const role of ['member','restricted_admin','system_owner']){
 ctx.context={platform_role:role,can_enter:role!=='system_owner'};
 vm.runInContext('renderIntegrationPreparation(null,context)',ctx);
}
assert.doesNotMatch(source,/\bfetch\s*\(|localStorage|sessionStorage|\.rpc\s*\(/);
console.log('PASS: manifest validation, wrong-project/origin/credential rejection, owner/session gate and no network or persistence.');
