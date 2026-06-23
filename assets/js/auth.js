/**
 * auth.js — Login & Registration validation + submission
 */

// ── Validation Rules ───────────────────────────────────────────
const EMAIL_RE  = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_RE   = /^[A-Za-z\s'\-\.]{2,80}$/;

// ── Field helpers ──────────────────────────────────────────────
function setError(fieldId, groupId, msg) {
  const err = document.getElementById(fieldId);
  const grp = document.getElementById(groupId);
  if (err) err.textContent = msg;
  if (grp) grp.classList.toggle('has-error', !!msg);
}

function clearError(fieldId, groupId) {
  setError(fieldId, groupId, '');
}

function showAlert(msg, type = 'danger') {
  const el = document.getElementById('auth-alert');
  if (!el) return;
  el.className = `alert alert--${type}`;
  el.textContent = msg;
  el.classList.remove('hidden');
}

function hideAlert() {
  const el = document.getElementById('auth-alert');
  if (el) el.classList.add('hidden');
}

// ── Show/Hide Password Toggle ──────────────────────────────────
function initPasswordToggle(btnId, inputId, showIconId, hideIconId) {
  const btn   = document.getElementById(btnId);
  const input = document.getElementById(inputId);
  if (!btn || !input) return;

  btn.addEventListener('click', () => {
    const isText = input.type === 'text';
    input.type = isText ? 'password' : 'text';
    btn.setAttribute('aria-label', isText ? 'Show password' : 'Hide password');
    if (showIconId && hideIconId) {
      document.getElementById(showIconId).style.display = isText ? '' : 'none';
      document.getElementById(hideIconId).style.display = isText ? 'none' : '';
    }
  });
}

// ── Password Strength ──────────────────────────────────────────
function getPasswordStrength(pw) {
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0–5
}

function renderStrength(pw) {
  const fill  = document.getElementById('pw-strength-fill');
  const label = document.getElementById('pw-strength-label');
  if (!fill || !label) return;

  const score = getPasswordStrength(pw);
  const levels = [
    { pct: 0,   cls: '',          text: '' },
    { pct: 20,  cls: 'very-weak', text: 'Very weak' },
    { pct: 40,  cls: 'weak',      text: 'Weak' },
    { pct: 60,  cls: 'fair',      text: 'Fair' },
    { pct: 80,  cls: 'good',      text: 'Good' },
    { pct: 100, cls: 'strong',    text: 'Strong' },
  ];
  const level = levels[score];
  fill.style.width = level.pct + '%';
  fill.className = `pw-strength__fill ${level.cls}`;
  label.textContent = pw ? level.text : '';
}

// ─────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────
const loginForm = document.getElementById('login-form');
if (loginForm) {
  initPasswordToggle('toggle-login-pw', 'login-password', 'eye-login-show', 'eye-login-hide');

  const emailEl = document.getElementById('login-email');
  const passEl  = document.getElementById('login-password');

  // Real-time: clear error on focus/input
  emailEl?.addEventListener('input', () => clearError('err-login-email', 'grp-login-email'));
  passEl?.addEventListener('input',  () => clearError('err-login-password', 'grp-login-password'));

  function validateLogin() {
    let valid = true;
    const email = emailEl.value.trim();
    const pass  = passEl.value;

    if (!email) {
      setError('err-login-email', 'grp-login-email', 'Email is required.');
      valid = false;
    } else if (!EMAIL_RE.test(email)) {
      setError('err-login-email', 'grp-login-email', 'Enter a valid email address.');
      valid = false;
    } else {
      clearError('err-login-email', 'grp-login-email');
    }

    if (!pass) {
      setError('err-login-password', 'grp-login-password', 'Password is required.');
      valid = false;
    } else {
      clearError('err-login-password', 'grp-login-password');
    }

    return valid;
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    if (!validateLogin()) return;

    const btn = document.getElementById('login-btn');
    btn.textContent = 'Signing in…';
    btn.disabled = true;

    try {
      const res  = await fetch(apiUrl('auth.php?action=login'), {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body:    new URLSearchParams({
          email:    emailEl.value.trim(),
          password: document.getElementById('login-password').value
        })
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem(STORAGE.USER, JSON.stringify(data.user));
        location.href = APP + 'dashboard.html';
      } else {
        showAlert(data.message || 'Invalid email or password.');
      }
    } catch (err) {
      showAlert('Could not reach the server. Check your connection.');
      console.error('Login error:', err);
    } finally {
      btn.textContent = 'Sign In';
      btn.disabled = false;
    }
  });
}

// ─────────────────────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────────────────────
const registerForm = document.getElementById('register-form');
if (registerForm) {
  initPasswordToggle('toggle-reg-pw',      'reg-password', 'eye-reg-show', 'eye-reg-hide');
  initPasswordToggle('toggle-reg-confirm', 'reg-confirm');

  const nameEl    = document.getElementById('reg-name');
  const emailEl   = document.getElementById('reg-email');
  const passEl    = document.getElementById('reg-password');
  const confirmEl = document.getElementById('reg-confirm');

  // Real-time clear + strength bar
  nameEl?.addEventListener('input',    () => clearError('err-reg-name',    'grp-reg-name'));
  emailEl?.addEventListener('input',   () => clearError('err-reg-email',   'grp-reg-email'));
  confirmEl?.addEventListener('input', () => clearError('err-reg-confirm', 'grp-reg-confirm'));
  passEl?.addEventListener('input', () => {
    clearError('err-reg-password', 'grp-reg-password');
    renderStrength(passEl.value);
    // Re-validate confirm if already touched
    if (confirmEl.value) {
      if (confirmEl.value !== passEl.value) {
        setError('err-reg-confirm', 'grp-reg-confirm', 'Passwords do not match.');
      } else {
        clearError('err-reg-confirm', 'grp-reg-confirm');
      }
    }
  });

  function validateRegister() {
    let valid = true;
    const name    = nameEl.value.trim();
    const email   = emailEl.value.trim();
    const pass    = passEl.value;
    const confirm = confirmEl.value;

    // Name
    if (!name) {
      setError('err-reg-name', 'grp-reg-name', 'Full name is required.');
      valid = false;
    } else if (!NAME_RE.test(name)) {
      setError('err-reg-name', 'grp-reg-name', 'Name may only contain letters, spaces, hyphens or apostrophes (2–80 chars).');
      valid = false;
    } else {
      clearError('err-reg-name', 'grp-reg-name');
    }

    // Email
    if (!email) {
      setError('err-reg-email', 'grp-reg-email', 'Email is required.');
      valid = false;
    } else if (!EMAIL_RE.test(email)) {
      setError('err-reg-email', 'grp-reg-email', 'Enter a valid email address (e.g. you@example.com).');
      valid = false;
    } else {
      clearError('err-reg-email', 'grp-reg-email');
    }

    // Password
    if (!pass) {
      setError('err-reg-password', 'grp-reg-password', 'Password is required.');
      valid = false;
    } else if (pass.length < 8) {
      setError('err-reg-password', 'grp-reg-password', 'Password must be at least 8 characters.');
      valid = false;
    } else if (getPasswordStrength(pass) < 2) {
      setError('err-reg-password', 'grp-reg-password', 'Password is too weak. Add uppercase letters, numbers, or symbols.');
      valid = false;
    } else {
      clearError('err-reg-password', 'grp-reg-password');
    }

    // Confirm
    if (!confirm) {
      setError('err-reg-confirm', 'grp-reg-confirm', 'Please confirm your password.');
      valid = false;
    } else if (pass !== confirm) {
      setError('err-reg-confirm', 'grp-reg-confirm', 'Passwords do not match.');
      valid = false;
    } else {
      clearError('err-reg-confirm', 'grp-reg-confirm');
    }

    return valid;
  }

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    if (!validateRegister()) return;

    const btn = document.getElementById('register-btn');
    btn.textContent = 'Creating account…';
    btn.disabled = true;

    try {
      const res  = await fetch(apiUrl('auth.php?action=register'), {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body:    new URLSearchParams({
          name:     nameEl.value.trim(),
          email:    emailEl.value.trim(),
          password: passEl.value
        })
      });
      const data = await res.json();

      if (data.success) {
        showAlert('Account created successfully! Redirecting to login…', 'success');
        setTimeout(() => location.href = 'login.html', 1800);
      } else {
        // Server-side errors: duplicate email, etc.
        const msg = data.message || 'Registration failed. Please try again.';
        if (msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('email')) {
          setError('err-reg-email', 'grp-reg-email', 'This email is already registered. Try logging in.');
        } else {
          showAlert(msg);
        }
      }
    } catch (err) {
      showAlert('Could not reach the server. Check your connection.');
      console.error('Register error:', err);
    } finally {
      btn.textContent = 'Create Account';
      btn.disabled = false;
    }
  });
}
