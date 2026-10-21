// Only a presentation preference is stored here, never authorization.
(() => {
  let choice = "system";
  try { choice = localStorage.getItem("tcms-theme") || "system"; } catch {}
  if (!["system", "light", "dark"].includes(choice)) choice = "system";
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  function apply() {
    document.documentElement.dataset.theme = choice === "system"
      ? (media.matches ? "dark" : "light") : choice;
  }
  apply();
  media.addEventListener("change", apply);
  document.addEventListener("DOMContentLoaded", () => {
    const header = document.querySelector("header");
    const account = document.querySelector("#account-summary");
    if (account) header.append(account);
    const label = document.createElement("label");
    label.className = "theme-control";
    label.textContent = "Appearance";
    const select = document.createElement("select");
    for (const value of ["system", "light", "dark"]) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value[0].toUpperCase() + value.slice(1);
      select.append(option);
    }
    select.value = choice;
    select.addEventListener("change", () => {
      choice = select.value;
      try { localStorage.setItem("tcms-theme", choice); } catch {}
      apply();
    });
    label.append(select);
    header.append(label);
  });
})();
