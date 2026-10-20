// All directory reads and decisions go through authorized database functions.
const list = document.querySelector("#pending-list");
const status = document.querySelector("#review-status");
const refresh = document.querySelector("#refresh-users");
const previous = document.querySelector("#previous-users");
const next = document.querySelector("#next-users");
let client;
let generation = 0;
let offset = 0;
let saving = false;
let available = false;

export function clearUsers() {
  generation += 1;
  available = false;
  list.replaceChildren();
  status.textContent = "";
  refresh.disabled = previous.disabled = next.disabled = true;
}

function explain(error) {
  if (error?.code === "42501") return "You no longer have permission. Select Check access.";
  if (error?.code === "40001" || error?.code === "P0002") return "This account changed. Refresh the list before deciding.";
  if (error?.code === "22023") return "Check the reason and email confirmation before trying again.";
  if (error?.code === "PGRST202" || error?.code === "42883") return "Account review is not installed yet. Run database migration 003.";
  return "The operation could not be confirmed. Refresh the list before trying again.";
}

function element(tag, text) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderRow(row) {
  const card = element("article");
  card.append(element("h3", row.display_name || "Name not provided"),
    element("p", row.email || "Email unavailable"),
    element("p", row.email_verified ? "Email confirmed" : "Email not confirmed"));
  const form = element("form");
  const fields = element("fieldset");
  fields.append(element("legend", "Review account"));
  const label = element("label", "Reason (5–500 characters)");
  const reason = element("textarea");
  reason.id = `reason-${row.user_id}`;
  label.htmlFor = reason.id;
  reason.required = true;
  reason.minLength = 5;
  reason.maxLength = 500;
  reason.rows = 3;
  const approve = element("button", "Approve");
  approve.type = "submit";
  approve.value = "approve";
  approve.disabled = !row.email_verified;
  const reject = element("button", "Reject");
  reject.type = "submit";
  reject.value = "reject";
  fields.append(label, reason, approve, reject);
  form.append(fields);
  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (saving || !available) return;
    const decision = event.submitter?.value;
    if (!["approve", "reject"].includes(decision)) return;
    if (reason.value.trim().length < 5) {
      status.textContent = "Enter a reason containing at least 5 characters.";
      reason.focus();
      return;
    }
    if (!window.confirm(`${decision === "approve" ? "Approve" : "Reject"} the account for ${row.email}?`)) return;
    saving = true;
    const request = generation;
    list.querySelectorAll("fieldset").forEach(node => { node.disabled = true; });
    refresh.disabled = previous.disabled = next.disabled = true;
    status.textContent = "Saving decision…";
    try {
      const { data, error } = await client.rpc("core_review_pending_account", {
        p_user_id: row.user_id,
        p_decision: decision,
        p_reason: reason.value.trim(),
        p_expected_updated_at: row.updated_at,
      });
      if (request !== generation) return;
      if (error) throw error;
      if (data?.user_id !== row.user_id
          || data?.account_status !== (decision === "approve" ? "active" : "rejected")) {
        throw new Error("Unexpected decision response");
      }
      offset = 0;
      await loadUsers(`Account ${decision === "approve" ? "approved" : "rejected"}.`);
    } catch (error) {
      if (request === generation) {
        // Do not keep actionable stale records after an uncertain write outcome.
        list.replaceChildren();
        status.textContent = explain(error);
        refresh.disabled = false;
      }
    } finally {
      saving = false;
    }
  });
  card.append(form);
  list.append(card);
}

async function loadUsers(prefix = "") {
  const request = ++generation;
  list.replaceChildren();
  refresh.disabled = previous.disabled = next.disabled = true;
  status.textContent = `${prefix} Loading pending accounts…`.trim();
  try {
    const { data, error } = await client.rpc("core_list_pending_accounts", { p_offset: offset });
    if (request !== generation || !available) return;
    if (error) throw error;
    if (!Array.isArray(data)) throw new Error("Unexpected directory response");
    data.slice(0, 20).forEach(renderRow);
    status.textContent = `${prefix} ${data.length ? "Review a pending account below." : "No pending accounts on this page."}`.trim();
    previous.disabled = offset === 0;
    next.disabled = data.length <= 20;
  } catch (error) {
    if (request === generation) status.textContent = `${prefix} ${explain(error)}`.trim();
  } finally {
    if (request === generation && available) refresh.disabled = false;
  }
}

export async function showUsers(authClient) {
  client = authClient;
  available = true;
  await loadUsers();
}

refresh.addEventListener("click", () => {
  if (available && !saving) { offset = 0; void loadUsers(); }
});
previous.addEventListener("click", () => {
  if (available && !saving) { offset = Math.max(0, offset - 20); void loadUsers(); }
});
next.addEventListener("click", () => {
  if (available && !saving) { offset += 20; void loadUsers(); }
});
