// Database functions enforce every permission; these controls are only presentation.
export const permissionLabels = {
  view: "Open transport and view vehicles",
  create_request: "Create transport requests",
  edit_request: "Edit permitted requests",
  approve_request: "Approve and complete requests",
  manage_fleet: "Add and edit vehicles",
  view_all: "View all users' requests (otherwise own requests only)",
};
export function node(tag, text) {
  const n = document.createElement(tag);
  if (text !== undefined) n.textContent = text;
  return n;
}
export async function api(client, action, payload = {}) {
  const { data, error } = await client.rpc("tcms_api", { p_action: action, p_payload: payload });
  if (error) throw error;
  return data;
}
export function errorText(error) {
  if (error?.code === "42501") return "Access denied. Your permissions may have changed. Select Check access.";
  if (error?.code === "40001") return "Someone changed this record. Refresh and review it before saving again.";
  if (error?.code === "23505") return "That registration number already exists.";
  if (error?.code === "22023") return error.message || "Check the entered values.";
  if (error?.code === "23514" || error?.code === "23502") return "Complete all required fields and check the permitted values.";
  return "The operation could not be confirmed. Refresh before trying again.";
}
export function field(form, name, labelText, options = {}) {
  const label = node("label", labelText);
  const input = node(options.choices ? "select" : "input");
  input.name = name;
  input.id = `${form.id}-${name}`;
  label.htmlFor = input.id;
  if (options.choices) for (const [value, text] of options.choices) {
    const opt = node("option", text); opt.value = value; input.append(opt);
  } else input.type = options.type || "text";
  for (const key of ["required", "min", "max", "minLength", "maxLength", "step"]) {
    if (options[key] !== undefined) input[key] = options[key];
  }
  if (options.value !== undefined) input.value = options.value;
  form.append(label, input);
  return input;
}
let epoch = 0;
let root;
export function clearModules() {
  epoch++;
  root?.replaceChildren();
}
export async function showModules(client, context, page) {
  clearModules();
  root = document.querySelector("#module-content");
  if (!root) return;
  const current = epoch;
  const message = node("p", "Loading permissions…");
  message.setAttribute("role", "status");
  root.append(message);
  try {
    const permissions = await api(client, "my_permissions");
    if (current !== epoch) return;
    message.textContent = "";
    if (page === "home") {
      if (permissions.view) {
        const link = node("a", "Open Transport");
        link.href = "./transport.html";
        root.append(link, node("p", "Vehicles, reservations and transport requests."));
      } else root.append(node("p", "No modules assigned. Contact an administrator to request access."));
    } else if (page === "users") await directory(client, context, current, message);
    else if (page === "transport") {
      if (!permissions.view) { message.textContent = "You do not have transport access."; return; }
      const transport = await import("./transport.js");
      await transport.renderTransport(client, context, permissions, root, () => current === epoch);
    }
  } catch (error) {
    if (current === epoch) message.textContent = errorText(error);
  }
}
async function directory(client, context, current, message) {
  let offset = 0;
  let saving = false;
  const records = node("div");
  const refresh = node("button", "Refresh user permissions");
  const previous = node("button", "Previous users");
  const next = node("button", "Next users");
  root.append(refresh, records, previous, next);
  const load = async () => {
    records.replaceChildren();
    refresh.disabled = previous.disabled = next.disabled = true;
    try {
      const rows = await api(client, "directory", { offset });
      if (current !== epoch) return;
      if (!Array.isArray(rows)) throw new Error("Invalid directory");
      for (const row of rows.slice(0, 20)) render(row);
      previous.disabled = offset === 0;
      next.disabled = rows.length <= 20;
      message.textContent = rows.length ? "Select a transport profile or override individual permissions." : "No users.";
    } catch (error) { if (current === epoch) message.textContent = errorText(error); }
    finally { if (current === epoch) refresh.disabled = false; }
  };
  const render = row => {
    const card = node("article");
    card.append(node("h3", row.display_name || row.email),
      node("p", `${row.email} · ${row.platform_role} · ${row.account_status}`));
    records.append(card);
    const protectedUser = row.user_id === context.user_id || row.platform_role === "system_owner"
      || (context.platform_role === "restricted_admin" && row.platform_role !== "member");
    if (protectedUser || row.account_status !== "active") {
      card.append(node("p", protectedUser ? "Protected account — no changes permitted here." : "Approve this account before assigning modules."));
      return;
    }
    const form = node("form"); form.id = `permissions-${row.user_id}`;
    const role = field(form, "role", "Transport profile", { value: row.module_role, choices: [
      ["none", "No access"], ["viewer", "Viewer — fleet and own requests"],
      ["requester", "Requester — create and edit own requests"], ["dispatcher", "Dispatcher — all transport operations"],
    ] });
    form.append(node("p", "Use role default follows the selected profile. Allow/Deny overrides it for this user. Opening transport must also be allowed."));
    for (const [key, label] of Object.entries(permissionLabels)) {
      field(form, key, label, { value: row.overrides[key] || "default", choices: [
        ["default", "Use role default"], ["allow", "Allow"], ["deny", "Deny"],
      ] });
    }
    const reason = field(form, "reason", "Reason for change", { required: true, minLength: 5, maxLength: 500 });
    const save = node("button", "Save permissions"); save.type = "submit"; form.append(save);
    form.addEventListener("submit", async event => {
      event.preventDefault();
      if (saving || current !== epoch) return;
      const overrides = {};
      for (const key of Object.keys(permissionLabels)) {
        const value = form.elements[key].value;
        if (value !== "default") overrides[key] = value;
      }
      if (!window.confirm(`Save transport permissions for ${row.email}?`)) return;
      saving = true; save.disabled = true; message.textContent = "Saving permissions…";
      try {
        const result = await api(client, "set_permissions", {
          user_id: row.user_id, role: role.value, overrides, reason: reason.value.trim(), version: row.version,
        });
        if (current !== epoch) return;
        if (result?.saved !== true) throw new Error("Unexpected response");
        await load();
        message.textContent = "Permissions saved and recorded in the audit trail.";
      } catch (error) {
        if (current === epoch) { records.replaceChildren(); message.textContent = errorText(error); }
      } finally { saving = false; if (current === epoch) refresh.disabled = false; }
    });
    card.append(form);
  };
  refresh.addEventListener("click", () => { if (!saving) void load(); });
  previous.addEventListener("click", () => { if (!saving) { offset = Math.max(0, offset - 20); void load(); } });
  next.addEventListener("click", () => { if (!saving) { offset += 20; void load(); } });
  await load();
}
