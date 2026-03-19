/* ===== auth.js - Authentication functionality ===== */

// ── Redirect if already authenticated ─────────────────────────
async function redirectIfAuthenticated(redirectTo = 'dashboard.html') {
  const res = await AuthAPI.check();
  if (res.ok) {
    window.location.href = redirectTo;
  }
}

// ── Redirect if NOT authenticated ─────────────────────────────
async function requireAuth(redirectTo = 'login.html') {
  const res = await AuthAPI.check();
  if (!res.ok) {
    window.location.href = redirectTo;
    return null;
  }
  return res.data.data;
}

// ── Set user info in navbar ────────────────────────────────────
function setNavbarUser(user) {
  const nameEl = document.getElementById('nav-user-name');
  if (nameEl && user) nameEl.textContent = user.full_name || user.email;
}

// ── Register Form ──────────────────────────────────────────────
async function handleRegister(e) {
  e.preventDefault();
  clearFormErrors('register-form');
  clearAlerts();

  const full_name = document.getElementById('full_name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirm_password = document.getElementById('confirm_password').value;
  const phone = document.getElementById('phone') ? document.getElementById('phone').value.trim() : '';

  let valid = true;
  if (!full_name) { setFieldError('full_name', 'Full name is required'); valid = false; }
  if (!email) { setFieldError('email', 'Email is required'); valid = false; }
  if (!password) { setFieldError('password', 'Password is required'); valid = false; }
  else if (password.length < 6) { setFieldError('password', 'Password must be at least 6 characters'); valid = false; }
  if (password !== confirm_password) { setFieldError('confirm_password', 'Passwords do not match'); valid = false; }
  if (!valid) return;

  const btn = document.getElementById('register-btn');
  setButtonLoading(btn, true, 'Registering...');

  const res = await AuthAPI.register({ full_name, email, password, phone });
  setButtonLoading(btn, false, 'Register');

  if (res.ok) {
    showAlert('Registration successful! Redirecting...', 'success');
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 1500);
  } else {
    showAlert(res.data.message || 'Registration failed', 'error');
  }
}

// ── Login Form ─────────────────────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();
  clearFormErrors('login-form');
  clearAlerts();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  let valid = true;
  if (!email) { setFieldError('email', 'Email is required'); valid = false; }
  if (!password) { setFieldError('password', 'Password is required'); valid = false; }
  if (!valid) return;

  const btn = document.getElementById('login-btn');
  setButtonLoading(btn, true, 'Logging in...');

  const res = await AuthAPI.login({ email, password });
  setButtonLoading(btn, false, 'Login');

  if (res.ok) {
    showAlert('Login successful! Redirecting...', 'success');
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
  } else {
    showAlert(res.data.message || 'Login failed', 'error');
  }
}

// ── Logout ─────────────────────────────────────────────────────
async function handleLogout() {
  await AuthAPI.logout();
  window.location.href = 'login.html';
}

// ── Profile Update ─────────────────────────────────────────────
async function handleProfileUpdate(e) {
  e.preventDefault();
  clearAlerts();

  const full_name = document.getElementById('full_name').value.trim();
  const phone = document.getElementById('phone') ? document.getElementById('phone').value.trim() : '';

  if (!full_name) { setFieldError('full_name', 'Full name is required'); return; }

  const btn = document.getElementById('profile-btn');
  setButtonLoading(btn, true, 'Saving...');

  const res = await AuthAPI.updateProfile({ full_name, phone });
  setButtonLoading(btn, false, 'Save Changes');

  if (res.ok) {
    showAlert('Profile updated successfully!', 'success');
  } else {
    showAlert(res.data.message || 'Update failed', 'error');
  }
}

// ── Load Profile ───────────────────────────────────────────────
async function loadProfile() {
  const res = await AuthAPI.getProfile();
  if (!res.ok) return;

  const user = res.data.data;
  const nameEl = document.getElementById('full_name');
  const emailEl = document.getElementById('email');
  const phoneEl = document.getElementById('phone');
  const memberSinceEl = document.getElementById('member-since');

  if (nameEl) nameEl.value = user.full_name || '';
  if (emailEl) emailEl.value = user.email || '';
  if (phoneEl) phoneEl.value = user.phone || '';
  if (memberSinceEl) memberSinceEl.textContent = formatDate(user.created_at);
  setNavbarUser(user);
}

// ── Init auth on login/register pages ─────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    redirectIfAuthenticated();
    loginForm.addEventListener('submit', handleLogin);
  }

  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    redirectIfAuthenticated();
    registerForm.addEventListener('submit', handleRegister);
  }

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

  const profileForm = document.getElementById('profile-form');
  if (profileForm) {
    profileForm.addEventListener('submit', handleProfileUpdate);
    loadProfile();
  }
});
