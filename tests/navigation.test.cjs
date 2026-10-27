const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const path = require("node:path");
const source = fs.readFileSync(path.join(__dirname, process.argv[2] || "app.js"), "utf8")
  .replace("void initialize();", "");

async function scenario(page, session, rpc) {
  const elements = {};
  for (const id of ["auth-status", "sign-in-form", "workspace", "account-summary",
    "session-actions", "check-access", "sign-out", "register-link", "manage-users-link"]) {
    elements[`#${id}`] = {
      hidden: false, textContent: "", disabled: true,
      addEventListener() {}, querySelector() { return this; },
    };
  }
  if (!["home", "users", "hr"].includes(page)) {
    elements["#workspace"] = null;
    elements["#account-summary"] = null;
  }
  if (page !== "login") elements["#sign-in-form"] = null;
  let redirect;
  const client = {
    auth: { getSession: async () => ({ data: { session }, error: null }) },
    rpc: async () => rpc,
  };
  const context = vm.createContext({
    document: { body: { dataset: { page } }, querySelector: id => elements[id] },
    window: { location: { replace: url => { redirect = url; } } },
    mockClient: client,
  });
  vm.runInContext(source, context);
  if (process.argv[2]) {
    vm.runInContext("hr = {clearHR(){}, async showHR(){}}; userManagement = {clearUsers(){}, async showUsers(){}};", context);
  }
  await vm.runInContext("client = mockClient; checkAccess();", context);
  return { elements, redirect };
}

(async () => {
  const session = { user: { id: "owner-id", email: "owner@example.com" } };
  const active = { data: { user_id: "owner-id", can_enter: true, platform_role: "system_owner" } };
  const onboarding = { data: { ...active.data, can_enter: false, account_can_enter: true, must_change_password: true } };
  for (const route of ["login", "home", "users", "transport"]) assert.equal((await scenario(route, session, onboarding)).redirect, "./change-password.html");
  const hrAccount = { data: { ...active.data, platform_role: "member", has_hr_access: true } };
  assert.equal((await scenario("hr", session, hrAccount)).elements["#workspace"].hidden, false);
  assert.equal((await scenario("hr", session, {data:{...active.data,platform_role:"member",has_hr_access:false}})).elements["#workspace"].hidden, true);
  assert.equal((await scenario("users", session, hrAccount)).elements["#workspace"].hidden, true);
  const pending = { data: { user_id: "owner-id", can_enter: false, email_verified: true, account_status: "pending" } };
  assert.equal((await scenario("home", null)).redirect, "./index.html");
  assert.equal((await scenario("login", session, active)).redirect, "./home.html");
  assert.equal((await scenario("register", session, active)).redirect, "./home.html");
  assert.equal((await scenario("home", session, pending)).redirect, "./index.html");
  const denied = await scenario("login", session, pending);
  assert.match(denied.elements["#auth-status"].textContent, /awaiting administrator/);
  const allowed = await scenario("home", session, active);
  assert.equal(allowed.elements["#workspace"].hidden, false);
  assert.match(allowed.elements["#account-summary"].textContent, /System Owner/);
  for (const response of [{ error: new Error("offline") }, { data: { ...active.data, user_id: "other" } }]) {
    const result = await scenario("home", session, response);
    assert.equal(result.elements["#workspace"].hidden, true);
    assert.equal(result.elements["#account-summary"].textContent, "");
  }
  if (process.argv[2]) {
    assert.equal((await scenario("users", null)).redirect, "./index.html");
    const member = { data: { ...active.data, platform_role: "member" } };
    const denied = await scenario("users", session, member);
    assert.equal(denied.elements["#workspace"].hidden, true);
    assert.match(denied.elements["#auth-status"].textContent, /Administrator access/);
    assert.equal((await scenario("home", session, member)).elements["#manage-users-link"].hidden, true);
    assert.equal((await scenario("users", session, active)).elements["#workspace"].hidden, false);
    console.log("PASS: user-management route denies members and signed-out users; owner route allowed.");
  }
  console.log("PASS: signed-out guard, login/register routing, pending denial, owner rendering, RPC failure and identity mismatch.");
})().catch(error => { console.error(error); process.exitCode = 1; });
