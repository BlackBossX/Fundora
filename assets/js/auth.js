/**
 * auth.js — Login & Registration logic (localStorage-based)
 * For production: replace fetch calls to php/auth.php
 */

function showAlert(msg, type = 'danger') {
  const el = document.getElementById('auth-alert');
  if (!el) return;
  el.className = `alert alert--${type}`;
  el.textContent = msg;
  el.classList.remove('hidden');
}

// ── LOGIN ──────────────────────────────────────────────────────
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
      showAlert('Please fill in all fields.');
      return;
    }

    try {
      const response = await fetch(apiUrl('auth.php?action=login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ email, password })
      });
      const data = await response.json();

      if (data.success) {
        localStorage.setItem(STORAGE.USER, JSON.stringify(data.user));
        location.href = APP + 'dashboard.html';
      } else {
        showAlert(data.message || 'Invalid email or password.');
      }
    } catch (error) {
      console.error('Login error:', error);
      showAlert('An error occurred during login. Is the local PHP server running?');
    }
  });
}

// ── REGISTER ───────────────────────────────────────────────────
const registerForm = document.getElementById('register-form');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name     = document.getElementById('reg-name').value.trim();
    const email    = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirm  = document.getElementById('reg-confirm').value;

    if (!name || !email || !password || !confirm) {
      showAlert('Please fill in all fields.');
      return;
    }
    if (password.length < 8) {
      showAlert('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      showAlert('Passwords do not match.');
      return;
    }

    try {
      const response = await fetch(apiUrl('auth.php?action=register'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ name, email, password })
      });
      const data = await response.json();

      if (data.success) {
        showAlert('Account created successfully! Redirecting...', 'success');
        setTimeout(() => location.href = 'login.html', 1500);
      } else {
        showAlert(data.message || 'Registration failed.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      showAlert('An error occurred during registration. Is the local PHP server running?');
    }
  });
}
