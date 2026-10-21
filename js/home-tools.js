// These controls use the existing identity-foundation RPCs.
let container;
let generation = 0;
function node(tag, text) {
  const result = document.createElement(tag);
  if (text !== undefined) result.textContent = text;
  return result;
}
export function clearHomeTools() {
  generation += 1;
  container?.remove();
  container = null;
}
export async function showHomeTools(client, context, { platform = true, compact = false } = {}) {
  clearHomeTools();
  const request = generation;
  container = node(compact ? "details" : "div");
  container.id = "account-settings";
  container.className = compact ? "account-disclosure" : "workspace-tools";
  if (compact) container.append(node("summary", "My account settings"));
  document.querySelector("#workspace").append(container);
  const profile = node("section");
  profile.className = "tool-card";
  profile.append(node("h2", "My account"));
  const form = node("form");
  const label = node("label", "Display name");
  const input = node("input");
  input.id = "display-name";
  label.htmlFor = input.id;
  input.required = true;
  input.maxLength = 120;
  input.value = context.display_name || "";
  input.autocomplete = "name";
  const save = node("button", "Save name");
  save.type = "submit";
  const feedback = node("p");
  feedback.setAttribute("role", "status");
  form.append(label, input, save);
  profile.append(form, feedback);
  container.append(profile);
  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (save.disabled || request !== generation) return;
    if (!input.value.trim()) { feedback.textContent = "Enter your name."; return; }
    save.disabled = true;
    try {
      const {data, error} = await client.rpc("core_update_my_display_name", {p_display_name: input.value.trim()});
      if (request !== generation) return;
      if (error || data?.user_id !== context.user_id) throw new Error("Save failed");
      feedback.textContent = "Your name was saved.";
      const role = {system_owner:"System Owner",restricted_admin:"Restricted Administrator"}[data.platform_role] || "Member";
      document.querySelector("#account-summary").textContent = `${data.display_name} · ${role}`;
    } catch {
      if (request === generation) feedback.textContent = "Unable to confirm the change. Select Check access before retrying.";
    } finally { if (request === generation) save.disabled = false; }
  });
  if (!platform || context.platform_role !== "system_owner") return;
  const control = node("section");
  control.className = "tool-card";
  control.append(node("h2", "Platform access"),
    node("p", "Only the System Owner can change this setting. Disabling access blocks protected operations for everyone except the active, verified Owner. It does not delete accounts."));
  const state = node("p", "Checking current setting…");
  state.setAttribute("role", "status");
  const reasonLabel = node("label", "Reason for this change");
  const reason = node("textarea");
  reason.id = "access-reason";
  reasonLabel.htmlFor = reason.id;
  reason.maxLength = 500;
  reason.rows = 3;
  const toggle = node("button", "Checking access");
  toggle.type = "button";
  toggle.disabled = true;
  const reload = node("button", "Refresh setting");
  reload.type = "button";
  control.append(state, reasonLabel, reason, toggle, reload);
  container.append(control);
  let settings;
  let busy = false;
  async function load() {
    toggle.disabled = true;
    try {
      const {data,error} = await client.rpc("core_get_access_control");
      if (request !== generation) return;
      if (error || typeof data?.access_enabled !== "boolean" || !Number.isSafeInteger(data.version)) throw new Error("Denied");
      settings = data;
      state.textContent = data.access_enabled ? "Platform access is enabled." : "Platform access is disabled for other users.";
      toggle.textContent = data.access_enabled ? "Disable platform access" : "Enable platform access";
      toggle.className = data.access_enabled ? "danger" : "";
      toggle.disabled = false;
    } catch {
      if (request === generation) {
        settings = null;
        state.textContent = "Unable to verify the setting. No change is available until it can be refreshed.";
      }
    }
  }
  reload.addEventListener("click", () => { if (!busy) void load(); });
  toggle.addEventListener("click", async () => {
    if (!settings || busy || request !== generation) return;
    if (reason.value.trim().length < 5) {
      state.textContent = "Enter a reason containing 5 to 500 characters.";
      reason.focus(); return;
    }
    if (!window.confirm(settings.access_enabled
      ? "Disable access for all other users? Your Owner access will remain available."
      : "Restore platform access? Each account will still require its own permissions.")) return;
    busy = true;
    toggle.disabled = reload.disabled = true;
    try {
      const {error} = await client.rpc("core_set_global_access", {
        p_enabled: !settings.access_enabled,
        p_expected_version: settings.version,
        p_reason: reason.value.trim(),
      });
      if (request !== generation) return;
      if (error) throw error;
      reason.value = "";
      await load();
    } catch {
      if (request === generation) {
        settings = null;
        state.textContent = "The change could not be confirmed. Refresh the setting before retrying.";
      }
    } finally {
      busy = false;
      if (request === generation) reload.disabled = false;
    }
  });
  await load();
}
