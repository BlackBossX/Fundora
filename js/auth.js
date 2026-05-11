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
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
      showAlert('Please fill in all fields.');
      return;
    }

    // Check against stored users
    const users = JSON.parse(localStorage.getItem('fundora_users') || '[]');
    const user  = users.find(u => u.email === email && u.password === btoa(password));

    if (!user) {
      showAlert('Invalid email or password.');
      return;
    }

    // Store session
    localStorage.setItem(STORAGE.USER, JSON.stringify({ id: user.id, name: user.name, email: user.email }));
    location.href = 'dashboard.html';
  });
}

// ── REGISTER ───────────────────────────────────────────────────
const registerForm = document.getElementById('register-form');
if (registerForm) {
  registerForm.addEventListener('submit', (e) => {
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

    const users = JSON.parse(localStorage.getItem('fundora_users') || '[]');
    if (users.find(u => u.email === email)) {
      showAlert('An account with this email already exists.');
      return;
    }

    const newUser = { id: Date.now(), name, email, password: btoa(password) };
    users.push(newUser);
    localStorage.setItem('fundora_users', JSON.stringify(users));
    localStorage.setItem(STORAGE.USER, JSON.stringify({ id: newUser.id, name, email }));
    location.href = 'dashboard.html';
  });
}
