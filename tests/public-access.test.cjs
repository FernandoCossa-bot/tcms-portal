const fs = require("node:fs");
const assert = require("node:assert/strict");
const config = fs.readFileSync(process.argv[2], "utf8");
const url = config.match(/SUPABASE_URL\s*=\s*["']([^"']+)/)?.[1];
const key = config.match(/SUPABASE_PUBLISHABLE_KEY\s*=\s*["']([^"']+)/)?.[1];
assert.equal(url, "https://yvrrfedbaugqfgrvnmar.supabase.co");
assert.ok(key?.startsWith("sb_publishable_"), "Only a publishable key may be used");
(async () => {
  for (const [path, body] of [
    ["/rest/v1/rpc/tcms_api", { p_action: "my_permissions", p_payload: {} }],
    ["/rest/v1/transport_requests?select=id", null],
    ["/rest/v1/core_module_access?select=user_id", null],
  ]) {
    const response = await fetch(`${url}${path}`, {
      method: body ? "POST" : "GET",
      headers: { apikey: key, "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(15000),
    });
    assert.ok([401,403].includes(response.status), `Unexpected public access: ${response.status}`);
    console.log(`PASS: anonymous request denied (${response.status}) for ${path.split("?")[0]}`);
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
