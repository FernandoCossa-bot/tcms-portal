const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const assert = require("node:assert/strict");
class Element {
  constructor(tag = "div") { this.tag = tag; this.children = []; this.handlers = {}; this.value = ""; }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = nodes; }
  addEventListener(event, handler) { this.handlers[event] = handler; }
  focus() {}
  querySelectorAll(tag) {
    return this.children.flatMap(node => [ ...(node.tag === tag ? [node] : []), ...node.querySelectorAll(tag)]);
  }
}
async function setup(reviewError) {
  const nodes = Object.fromEntries(["pending-list", "review-status", "refresh-users",
    "previous-users", "next-users"].map(id => ["#" + id, new Element()]));
  const calls = [];
  const row = { user_id: "test-id", display_name: "<script>not executable</script>",
    email: "test@example.com", email_verified: true, updated_at: "2026-10-21T00:00:00Z" };
  let reviewed = false;
  const client = { async rpc(name, args) {
    calls.push({name,args});
    if (name === "core_list_pending_accounts") return {data: reviewed ? [] : [row]};
    if (reviewError) return {error: reviewError};
    reviewed = true;
    return {data:{user_id:row.user_id, account_status: args.p_decision === "approve" ? "active" : "rejected"}};
  }};
  const context = vm.createContext({
    document: { querySelector: selector => nodes[selector], createElement: tag => new Element(tag) },
    window: {confirm: () => true}, mockClient: client,
  });
  const source = fs.readFileSync(path.join(__dirname, process.argv[2] || "users.js"), "utf8")
    .replaceAll("export function", "function").replaceAll("export async function", "async function");
  vm.runInContext(source, context);
  await vm.runInContext("showUsers(mockClient)", context);
  return {nodes,calls,context};
}
(async () => {
  for (const decision of ["approve", "reject"]) {
    const {nodes,calls} = await setup();
    const list = nodes["#pending-list"];
    assert.equal(list.children[0].children[0].textContent, "<script>not executable</script>");
    const form = list.querySelectorAll("form")[0];
    const reason = form.querySelectorAll("textarea")[0];
    reason.value = "Reviewed by administrator";
    await form.handlers.submit({preventDefault(){},submitter:{value:decision}});
    const review = calls.find(call => call.name === "core_review_pending_account");
    assert.equal(review.args.p_decision, decision);
    assert.equal(review.args.p_expected_updated_at, "2026-10-21T00:00:00Z");
    assert.equal(list.children.length, 0);
    assert.match(nodes["#review-status"].textContent, /Account (approved|rejected)/);
  }
  const failed = await setup({code:"40001"});
  const form = failed.nodes["#pending-list"].querySelectorAll("form")[0];
  form.querySelectorAll("textarea")[0].value = "Reviewed by administrator";
  await form.handlers.submit({preventDefault(){},submitter:{value:"approve"}});
  assert.equal(failed.nodes["#pending-list"].children.length,0);
  assert.match(failed.nodes["#review-status"].textContent,/changed/);
  vm.runInContext("clearUsers()", failed.context);
  assert.equal(failed.nodes["#review-status"].textContent,"");
  console.log("PASS: approve/reject RPC payloads, safe text rendering, stale-record handling and sensitive-list cleanup.");
})().catch(error => { console.error(error); process.exitCode = 1; });
