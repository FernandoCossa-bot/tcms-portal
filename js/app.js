// Shared session controller. Database RPCs, not navigation, enforce authorization.
const page = document.body.dataset.page;
const status = document.querySelector("#auth-status");
const login = document.querySelector("#sign-in-form");
const fields = login?.querySelector("fieldset");
const workspace = document.querySelector("#workspace");
const summary = document.querySelector("#account-summary");
const actions = document.querySelector("#session-actions");
const refresh = document.querySelector("#check-access");
const logout = document.querySelector("#sign-out");
const registerLink = document.querySelector("#register-link");
const manageUsersLink = document.querySelector("#manage-users-link");
const protectedPage = ["home", "users", "transport", "password", "hr"].includes(page);
let modules;
let userManagement;
let homeTools;
let registration;
let passwordChange;
let hr;
let client;
let generation = 0;
let signingOut = false;
let checking;

function clearProtectedContent() {
  generation += 1;
  if (workspace) workspace.hidden = true;
  if (summary) summary.textContent = "";
  if (manageUsersLink) manageUsersLink.hidden = true;
  userManagement?.clearUsers();
  homeTools?.clearHomeTools();
  modules?.clearModules();
  hr?.clearHR();
}

function denyMessage(context) {
  if (!context.email_verified) return "Confirm your email address before continuing.";
  if (context.account_status === "pending") return "Your account is awaiting administrator approval.";
  if (context.account_status !== "active") return "Your account does not currently have access. Contact an administrator.";
  return "Platform access is temporarily disabled.";
}

async function checkAccess() {
  if (signingOut) return;
  clearProtectedContent();
  const request = generation;
  refresh.disabled = true;
  if (fields) fields.disabled = true;
  status.textContent = "Checking access…";
  try {
    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    if (request !== generation) return;
    if (sessionError) throw sessionError;
    const session = sessionData.session;
    actions.hidden = !session;
    if (login) login.hidden = Boolean(session);
    if (registerLink) registerLink.hidden = Boolean(session);
    registration?.showRegistration(!session);
    if (!session) {
      if (protectedPage) {
        window.location.replace("./index.html");
        return;
      }
      if (fields) fields.disabled = false;
      status.textContent = page === "register"
        ? "Request an account using an email address you can access."
        : "Enter your email address and password.";
      return;
    }
    const { data: context, error } = await client.rpc("core_get_my_context");
    if (request !== generation) return;
    if (error || !context || context.user_id !== session.user.id) {
      throw new Error("Access check failed");
    }
    if (context.must_change_password === true && context.account_can_enter === true) {
      if (page !== 'password') { window.location.replace('./change-password.html'); return; }
      workspace.hidden = false;
      status.textContent = 'Set your personal password before entering the workspace.';
      passwordChange?.initializePasswordChange(client);
      return;
    }
    if (page === 'password' && context.can_enter === true) { window.location.replace('./home.html'); return; }
    if (context.can_enter !== true) {
      if (protectedPage) window.location.replace("./index.html");
      else status.textContent = denyMessage(context);
      return;
    }
    if (!protectedPage) {
      window.location.replace("./home.html");
      return;
    }
    if (page === 'hr' && context.has_hr_access !== true) { status.textContent = 'Human Resources access is required.'; return; }
    const roles = { system_owner: "System Owner", restricted_admin: "Restricted Administrator" };
    const administrator = context.platform_role === "system_owner";
    if (page === "users" && !administrator) {
      status.textContent = "Administrator access is required to manage users.";
      return;
    }
    summary.textContent = `${context.display_name || session.user.email} · ${roles[context.platform_role] || (context.has_hr_access ? "Human Resources" : "Member")}`;
    workspace.hidden = false;
    status.textContent = "Your account is active.";
    if (manageUsersLink) manageUsersLink.hidden = !administrator;
    if (page === "users") await userManagement.showUsers(client);
    if (page === "hr") await hr.showHR(client);
    if (["home", "users"].includes(page)) await homeTools?.showHomeTools(client, context, {
      platform: page === "users", compact: page === "home",
    });
    if (request === generation) await modules?.showModules(client, context, page);
  } catch {
    if (request === generation) {
      // No cached authorization fallback when the backend cannot be reached.
      status.textContent = "Unable to verify access. Check your connection and select Check access.";
      actions.hidden = false;
    }
  } finally {
    if (request === generation) refresh.disabled = false;
  }
}

login?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!client || fields.disabled) return;
  fields.disabled = true;
  status.textContent = "Signing in…";
  try {
    const { error } = await client.auth.signInWithPassword({
      email: login.elements.email.value.trim(),
      password: login.elements.password.value,
    });
    if (error) throw error;
    await checkAccess();
  } catch {
    status.textContent = "Unable to sign in. Check your credentials, email confirmation and connection.";
    fields.disabled = false;
  } finally {
    login.elements.password.value = "";
  }
});

refresh.addEventListener("click", () => { if (client) void checkAccess(); });
logout.addEventListener("click", async () => {
  if (!client) return;
  signingOut = true;
  clearProtectedContent();
  logout.disabled = true;
  status.textContent = "Signing out…";
  try {
    const { error } = await client.auth.signOut({ scope: "local" });
    if (error) throw error;
    window.location.replace("./index.html");
  } catch {
    status.textContent = "Sign-out could not be confirmed. Please try again.";
    signingOut = false;
    logout.disabled = false;
  }
});

async function initialize() {
  try {
    if (page === 'hr') hr = await import('./hr.js');
    if (page === 'password') passwordChange = await import('./password-change.js');
    // Import registration only where its form exists.
    if (page === "register") registration = await import("./registration.js");
    if (page === "users") userManagement = await import("./users.js");
    if (["home", "users"].includes(page)) homeTools = await import("./home-tools.js");
    if (protectedPage) modules = await import("./modules.js");
    const [config, library] = await Promise.all([
      import("./config.js"),
      import("https://esm.sh/@supabase/supabase-js@2.117.2"),
    ]);
    if (!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(config.SUPABASE_URL)
        || !config.SUPABASE_PUBLISHABLE_KEY?.startsWith("sb_publishable_")) {
      throw new Error("Invalid public configuration");
    }
    client = library.createClient(config.SUPABASE_URL, config.SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
    registration?.initializeRegistration(client);
    client.auth.onAuthStateChange(() => {
      clearProtectedContent();
      // Do not await Supabase requests inside its Auth event callback.
      clearTimeout(checking);
      checking = setTimeout(() => { void checkAccess(); }, 0);
    });
    await checkAccess();
    // Do not destroy an in-progress form on a native confirmation-dialog focus change.
    // Every read/write rechecks authorization in the database; refresh is explicit.
    window.addEventListener("pageshow", (event) => {
      if (event.persisted) void checkAccess();
    });
    window.addEventListener("pagehide", clearProtectedContent);
  } catch {
    clearProtectedContent();
    if (fields) fields.disabled = true;
    registration?.showRegistration(false);
    status.textContent = "TCMS is unavailable. Check your connection, public configuration and local web server.";
  }
}

void initialize();
