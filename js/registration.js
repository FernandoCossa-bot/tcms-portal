// Auth creates the identity. The database trigger creates a pending profile.
// Never send effective roles, approval state or module permissions as metadata.
const section = document.querySelector("#registration");
const form = document.querySelector("#registration-form");
const fields = form.querySelector("fieldset");
const message = document.querySelector("#registration-status");
let client;
let busy = false;
let retryAfter = 0;

export function showRegistration(visible) {
  section.hidden = !visible || !client;
  if (!visible) {
    form.reset();
    section.open = false;
    message.textContent = "";
  }
}

export function initializeRegistration(authClient) {
  client = authClient;
  fields.disabled = false;
}

// Register immediately so a configuration failure cannot submit passwords
// through the browser's native form action.
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!client || busy) return;
  const displayName = form.elements.display_name.value.trim();
  const email = form.elements.email.value.trim();
  const password = form.elements.password.value;
  if (!displayName || displayName.length > 120) {
    message.textContent = "Enter your full name (up to 120 characters).";
    return;
  }
  if (password.length < 12 || password !== form.elements.confirm_password.value) {
    message.textContent = "Use at least 12 characters and enter the same password twice.";
    return;
  }
  if (Date.now() < retryAfter) {
    message.textContent = "Please wait a minute before requesting another email.";
    return;
  }
  busy = true;
  fields.disabled = true;
  message.textContent = "Submitting your request…";
  try {
    const { data: current, error: sessionError } = await client.auth.getSession();
    if (sessionError) throw sessionError;
    if (current.session) {
      message.textContent = "Sign out before requesting another account.";
      return;
    }
    const redirect = new URL("./index.html", window.location.href);
    if (!["http:", "https:"].includes(redirect.protocol)) {
      throw new Error("A web server is required");
    }
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirect.href,
        data: { display_name: displayName },
      },
    });
    retryAfter = Date.now() + 60000;
    if (error) {
      message.textContent = error.status === 429
        ? "Too many requests. Wait before trying again."
        : "Registration could not be completed. Check your details or contact the administrator to check email delivery.";
      return;
    }
    form.reset();
    // Generic response also covers existing addresses without enumerating users.
    message.textContent = data.session
      ? "Account request received. Administrator approval is still required."
      : "If this address is eligible, a confirmation email will arrive. Check your inbox and spam folder. If you already have an account, sign in instead.";
  } catch {
    message.textContent = "Unable to complete registration. Check your connection and try again.";
  } finally {
    form.elements.password.value = "";
    form.elements.confirm_password.value = "";
    busy = false;
    fields.disabled = false;
  }
});
