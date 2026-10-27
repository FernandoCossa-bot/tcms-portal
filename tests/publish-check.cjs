const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const files = ['ims.html','js/ims.js','js/integration-preparation.js','hr.html','js/hr.js','change-password.html','js/password-change.js','index.html','register.html','home.html','users.html','transport.html',
  'css/styles.css','js/app.js','js/config.js','js/ui.js','js/registration.js',
  'js/users.js','js/home-tools.js','js/modules.js','js/transport.js'];
const config = fs.readFileSync(path.join(root,'js/config.js'),'utf8');
assert.match(config,/SUPABASE_URL\s*=\s*["']https:\/\/yvrrfedbaugqfgrvnmar\.supabase\.co["']/);
assert.match(config,/SUPABASE_PUBLISHABLE_KEY\s*=\s*["']sb_publishable_[A-Za-z0-9_-]+["']/);
for (const file of files) {
  const text = fs.readFileSync(path.join(root,file),'utf8');
  assert.doesNotMatch(text,/sb_secret_[A-Za-z0-9_-]{12,}|gh[pousr]_[A-Za-z0-9]{20,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,'Secret detected: '+file);
  assert.doesNotMatch(text,/postgres(?:ql)?:\/\/[^\s:@]+:[^\s@]+@/,'Database credential detected: '+file);
  assert.doesNotMatch(text,/\b(?:select\s+[\w.*,\s]+\s+from\s+\w+|insert\s+into\s+\w+|update\s+\w+\s+set\s+|delete\s+from\s+|create\s+(?:table|policy|function|schema)\s+|alter\s+table\s+)/i,'Raw SQL detected: '+file);
  assert.doesNotMatch(text,/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/,'Embedded token detected: '+file);
  const dest=path.join(root,'dist',file);
  fs.mkdirSync(path.dirname(dest),{recursive:true});
  fs.copyFileSync(path.join(root,file),dest);
}
console.log(`PASS: ${files.length} explicitly allowed public files prepared; no SQL, tests or documentation included.`);
