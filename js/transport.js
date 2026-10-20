import { api, node, field, errorText } from "./modules.js";

// Form dates are explicitly Mozambique time (UTC+02:00), independent of device timezone.
export function toMozambiqueInput(iso) {
  return new Date(new Date(iso).getTime() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16);
}
export function fromMozambiqueInput(value) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error("Invalid date");
  return new Date(`${value}:00+02:00`).toISOString();
}
export async function renderTransport(client, context, permissions, root, alive) {
  let vehicles = [];
  let offset = 0;
  let saving = false;
  const message = node("p"); message.setAttribute("role", "status");
  const refresh = node("button", "Refresh transport");
  const editor = node("section");
  const fleet = node("section");
  const requests = node("section");
  root.append(message, refresh, editor, fleet, requests);
  const saveForm = (form, action, payload) => {
    form.addEventListener("submit", async event => {
      event.preventDefault();
      if (saving || !alive()) return;
      saving = true;
      const buttons = Array.from(root.querySelectorAll("button"), button => [button, button.disabled]);
      buttons.forEach(([button]) => { button.disabled = true; });
      message.textContent = "Saving…";
      try {
        const result = await api(client, action, payload());
        if (!alive()) return;
        if (result?.saved !== true) throw new Error("Unexpected response");
        editor.replaceChildren();
        offset = 0;
        await load();
        message.textContent = "Saved successfully. The list has been refreshed.";
      } catch (error) {
        if (alive()) message.textContent = errorText(error);
      } finally {
        saving = false;
        // Restore controls only if the same authorized view is still mounted.
        if (alive()) {
          buttons.forEach(([button, disabled]) => { if (button.isConnected) button.disabled = disabled; });
          refresh.disabled = false;
        }
      }
    });
  };
  const finishForm = (form, label) => {
    const submit = node("button", label); submit.type = "submit";
    const cancel = node("button", "Cancel"); cancel.type = "button";
    cancel.addEventListener("click", () => { if (!saving) editor.replaceChildren(); });
    form.append(submit, cancel);
    editor.replaceChildren(form);
    form.querySelector("input,select")?.focus();
  };
  const vehicleForm = (row = {}) => {
    const form = node("form"); form.id = "vehicle";
    form.append(node("h2", row.id ? "Edit vehicle" : "Register vehicle"));
    field(form, "registration", "Registration number", { value: row.registration || "", required: true, maxLength: 30 });
    field(form, "name", "Vehicle name / model", { value: row.name || "", required: true, maxLength: 120 });
    field(form, "capacity", "Passenger capacity", { value: row.capacity || 1, required: true, type: "number", min: 1, max: 100, step: 1 });
    field(form, "mileage", "Mileage (km)", { value: row.mileage || 0, required: true, type: "number", min: 0, max: 2147483647, step: 1 });
    field(form, "status", "Operational status", { value: row.status || "available", choices: [
      ["available", "Available"], ["maintenance", "Maintenance"], ["inactive", "Inactive"],
    ] });
    saveForm(form, "save_vehicle", () => ({
      id: row.id || null, version: row.version || null,
      registration: form.elements.registration.value.trim(), name: form.elements.name.value.trim(),
      capacity: Number(form.elements.capacity.value), mileage: Number(form.elements.mileage.value),
      status: form.elements.status.value,
    }));
    finishForm(form, "Save vehicle");
  };
  const requestForm = (row = {}) => {
    const form = node("form"); form.id = "request";
    form.append(node("h2", row.id ? "Edit transport request" : "New transport request"),
      node("p", "All departure and return times below use Mozambique time (UTC+02:00)."));
    field(form, "vehicle_id", "Vehicle", { value: row.vehicle_id || "", required: true,
      choices: [["", "Select a vehicle"], ...vehicles.map(v => [v.id, `${v.registration} — ${v.name} (${v.capacity} passengers; ${v.status})`])],
    });
    field(form, "destination", "Destination", { value: row.destination || "", required: true, maxLength: 200 });
    field(form, "purpose", "Purpose", { value: row.purpose || "", required: true, maxLength: 500 });
    field(form, "passengers", "Passengers", { value: row.passengers || 1, type: "number", required: true, min: 1, max: 100, step: 1 });
    field(form, "starts_at", "Departure — Mozambique time", { value: row.starts_at ? toMozambiqueInput(row.starts_at) : "", required: true, type: "datetime-local" });
    field(form, "ends_at", "Expected return — Mozambique time", { value: row.ends_at ? toMozambiqueInput(row.ends_at) : "", required: true, type: "datetime-local" });
    if (row.id) {
      field(form, "status", "Request status", { value: row.status, choices: permissions.approve_request
        ? [["pending", "Pending"], ["approved", "Approved"], ["completed", "Completed"], ["cancelled", "Cancelled"]]
        : [["pending", "Pending"], ["cancelled", "Cancelled"]],
      });
    }
    saveForm(form, "save_request", () => ({
      id: row.id || null, version: row.version || null, vehicle_id: form.elements.vehicle_id.value,
      destination: form.elements.destination.value.trim(), purpose: form.elements.purpose.value.trim(),
      passengers: Number(form.elements.passengers.value),
      starts_at: fromMozambiqueInput(form.elements.starts_at.value),
      ends_at: fromMozambiqueInput(form.elements.ends_at.value), status: row.id ? form.elements.status.value : "pending",
    }));
    finishForm(form, "Save request");
  };
  const load = async () => {
    refresh.disabled = true;
    fleet.replaceChildren(); requests.replaceChildren();
    message.textContent = "Loading vehicles and requests…";
    try {
      const [v, rows] = await Promise.all([api(client, "vehicles"), api(client, "requests", { offset })]);
      if (!alive()) return;
      if (!Array.isArray(v) || !Array.isArray(rows)) throw new Error("Invalid response");
      vehicles = v;
      fleet.append(node("h2", "Fleet"));
      if (permissions.manage_fleet) {
        const add = node("button", "Register vehicle"); add.addEventListener("click", () => { if (!saving) vehicleForm(); }); fleet.append(add);
      }
      if (!v.length) fleet.append(node("p", "No vehicles registered."));
      for (const item of v) {
        const card = node("article");
        card.append(node("h3", `${item.registration} — ${item.name}`),
          node("p", `${item.capacity} passengers · ${item.mileage} km · ${item.status}`));
        if (permissions.manage_fleet) {
          const edit = node("button", "Edit vehicle");
          edit.addEventListener("click", () => { if (!saving) vehicleForm(item); }); card.append(edit);
        }
        fleet.append(card);
      }
      requests.append(node("h2", permissions.view_all ? "All transport requests" : "My transport requests"));
      if (permissions.create_request) {
        const add = node("button", "New request");
        add.disabled = !v.some(vehicle => vehicle.status === "available");
        add.addEventListener("click", () => { if (!saving) requestForm(); }); requests.append(add);
        if (add.disabled) requests.append(node("p", "An available vehicle must be registered before you can request transport."));
      }
      if (!rows.length) requests.append(node("p", "No requests on this page."));
      for (const item of rows.slice(0, 20)) {
        const card = node("article");
        card.append(node("h3", `${item.destination} · ${item.status}`),
          node("p", `${item.registration} — ${item.vehicle_name}`),
          node("p", `${item.purpose} · ${item.passengers} passengers`),
          node("p", `${toMozambiqueInput(item.starts_at).replace("T", " ")} → ${toMozambiqueInput(item.ends_at).replace("T", " ")} (Mozambique)`));
        if (permissions.view_all) card.append(node("p", `Requested by: ${item.requester_name || item.requester_id}`));
        if (permissions.edit_request && !["completed", "cancelled"].includes(item.status)
            && (permissions.approve_request || item.status === "pending")
            && (permissions.view_all || item.requester_id === context.user_id)) {
          const edit = node("button", "Edit request");
          edit.addEventListener("click", () => { if (!saving) requestForm(item); }); card.append(edit);
        }
        requests.append(card);
      }
      const previous = node("button", "Previous requests"); previous.disabled = offset === 0;
      const next = node("button", "Next requests"); next.disabled = rows.length <= 20;
      previous.addEventListener("click", () => { if (!saving) { offset -= 20; void load(); } });
      next.addEventListener("click", () => { if (!saving) { offset += 20; void load(); } });
      requests.append(previous, next);
      message.textContent = "Transport is up to date.";
    } catch (error) {
      if (alive()) { editor.replaceChildren(); message.textContent = errorText(error); }
    } finally { if (alive()) refresh.disabled = false; }
  };
  refresh.addEventListener("click", () => { if (!saving) { editor.replaceChildren(); void load(); } });
  await load();
}
