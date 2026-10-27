let initialized = false;
export function initializePasswordChange(client) {
  if (initialized) return;
  initialized = true;
  const form = document.querySelector('#password-change-form');
  const status = document.querySelector('#password-status');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const password = form.elements.password.value;
    if (password.length < 12 || password !== form.elements.confirm.value) {
      status.textContent = 'Use at least 12 characters and enter the same password in both fields.'; return;
    }
    const button = form.querySelector('button'); button.disabled = true;
    status.textContent = 'Updating your password…';
    try {
      const {error} = await client.auth.updateUser({password});
      if (error) throw error;
      const {data, error: checkError} = await client.rpc('core_get_my_context');
      if (checkError || data?.must_change_password !== false || data?.can_enter !== true) throw new Error('verification');
      form.reset(); window.location.replace('./home.html');
    } catch {
      status.textContent = 'The change could not be confirmed. Use a different password. If your session has expired, sign out and sign in again.';
    } finally { button.disabled = false; }
  });
}
