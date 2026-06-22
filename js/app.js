/**
 * app.js — Fundora Core Utilities
 * Shared across all pages: session, formatting, sidebar setup
 */

// ── Storage Keys ──────────────────────────────────────────────
const STORAGE = {
  USER:     'fundora_user',
  INCOME:   'fundora_income',
  EXPENSES: 'fundora_expenses',
  BUDGETS:  'fundora_budgets',
};

// ── Session Helpers ────────────────────────────────────────────
function getUser() {
  try { return JSON.parse(localStorage.getItem(STORAGE.USER)); }
  catch { return null; }
}

function requireAuth() {
  // Pages that need login; redirect to login if no session
  const publicPages = ['index.html', 'login.html', 'register.html', ''];
  const page = location.pathname.split('/').pop();
  if (!publicPages.includes(page) && !getUser()) {
    location.href = 'login.html';
  }
}

function logout() {
  localStorage.removeItem(STORAGE.USER);
  location.href = 'login.html';
}

// ── Format Currency ────────────────────────────────────────────
function formatRs(amount) {
  return 'Rs. ' + Number(amount).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Format Date ────────────────────────────────────────────────
function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Current Month Label ────────────────────────────────────────
function currentMonthLabel() {
  return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// ── Current Month Filter ───────────────────────────────────────
function isThisMonth(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

// ── Sidebar Setup ──────────────────────────────────────────────
function initSidebar() {
  const user = getUser();
  const nameEl   = document.getElementById('sidebar-name');
  const avatarEl = document.getElementById('sidebar-avatar');
  const logoutEl = document.getElementById('logout-btn');
  const nav = document.querySelector('.sidebar__nav');

  if (nav && !nav.querySelector('a[href="goals.html"]')) {
    const goalsLink = document.createElement('a');
    goalsLink.href = 'goals.html';
    goalsLink.className = 'sidebar__nav-item';
    goalsLink.id = 'nav-goals';
    goalsLink.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>
    </svg>Goals & Savings`;
    const historyLink = nav.querySelector('a[href="history.html"]');
    nav.insertBefore(goalsLink, historyLink);
  }

  if (nav && !nav.querySelector('a[href="bills.html"]')) {
    const billsLink = document.createElement('a');
    billsLink.href = 'bills.html';
    billsLink.className = 'sidebar__nav-item';
    billsLink.id = 'nav-bills';
    billsLink.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2z"/><path d="M9 7h6M9 11h6"/>
    </svg>Bill Reminders`;
    const historyLink = nav.querySelector('a[href="history.html"]');
    nav.insertBefore(billsLink, historyLink);
  }

  if (nameEl && user)   nameEl.textContent   = user.name || 'User';
  if (avatarEl && user) avatarEl.textContent = (user.name || 'U')[0].toUpperCase();
  if (logoutEl) logoutEl.addEventListener('click', (e) => { e.preventDefault(); logout(); });
}

// ── Modal Helpers ──────────────────────────────────────────────
function openModal(id)  { const el = document.getElementById(id); if (el) el.classList.add('open'); }
function closeModal(id) { const el = document.getElementById(id); if (el) el.classList.remove('open'); }

// ── Category Emoji Map ─────────────────────────────────────────
const CAT_EMOJI = {
  Food: '🍜', Transport: '🚌', Rent: '🏠',
  Entertainment: '🎮', Health: '💊', Education: '📚', Other: '📦',
};

function incomeEmoji(source = '') {
  const value = source.toLowerCase();
  if (value.includes('salary') || value.includes('wage') || value.includes('pay')) return '💼';
  if (value.includes('scholarship') || value.includes('grant')) return '🎓';
  if (value.includes('freelance') || value.includes('project')) return '💻';
  if (value.includes('allowance')) return '💵';
  if (value.includes('gift') || value.includes('bonus')) return '🎁';
  if (value.includes('investment') || value.includes('interest') || value.includes('dividend')) return '📈';
  if (value.includes('refund') || value.includes('reimbursement')) return '↩️';
  if (value.includes('business') || value.includes('sale')) return '🏪';
  return '💰';
}

// ── Init ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  requireAuth();
  initSidebar();

  // Set current month on dashboard if element exists
  const monthEl = document.getElementById('current-month');
  if (monthEl) monthEl.textContent = currentMonthLabel();

  // Sync transactions + budgets from DB if user is logged in
  if (getUser()) {
    if (typeof syncTransactions === 'function') syncTransactions();
    if (typeof syncBudgets      === 'function') syncBudgets();
  }
});
