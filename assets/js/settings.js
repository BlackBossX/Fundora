/**
 * settings.js — Settings page logic (with DB-backed budgets)
 */

const CATEGORIES = ['Food','Transport','Rent','Entertainment','Health','Education','Other'];
const BUDGET_PERIODS = ['daily','weekly','monthly'];

// ── Budget Backend Sync ────────────────────────────────────────

async function fetchBudgetsFromDB() {
  try {
    const res = await fetch(apiUrl('budgets.php?action=fetch&_=') + Date.now());
    if (!res.ok) {
      console.warn('fetchBudgets: server returned', res.status, '— using localStorage only');
      return;
    }
    const text = await res.text();
    if (!text || text.trim().startsWith('<')) {
      // InfinityFree returned HTML (security page) — skip silently
      console.warn('fetchBudgets: got HTML instead of JSON — using localStorage only');
      return;
    }
    const data = JSON.parse(text);
    if (data.success) saveBudgets(data.budgets);
  } catch (e) {
    console.warn('fetchBudgets failed, using localStorage only:', e.message);
  }
}

async function saveBudgetsToDB(budgets) {
  try {
    // Send as form-urlencoded so InfinityFree WAF doesn't block the request.
    // budgets.php reads $_POST['budgets'] and JSON-decodes it server-side.
    const res = await fetch(apiUrl('budgets.php?action=save'), {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    new URLSearchParams({ budgets: JSON.stringify(budgets) })
    });
    if (!res.ok) {
      console.warn('saveBudgets: server returned', res.status, '— saved to localStorage only');
      return false;
    }
    const text = await res.text();
    if (!text || text.trim().startsWith('<')) {
      console.warn('saveBudgets: got HTML instead of JSON — saved to localStorage only');
      return false;
    }
    const data = JSON.parse(text);
    return data.success;
  } catch (e) {
    console.warn('saveBudgets failed, saved to localStorage only:', e.message);
    return false;
  }
}

// ── Render ─────────────────────────────────────────────────────

function renderBudgetLimits() {
  const grid = document.getElementById('budget-limits-grid');
  if (!grid) return;

  const budgets = getBudgets();

  grid.innerHTML = `
    <div class="budget-limit-header" aria-hidden="true">
      <span>Category</span>
      <span>Daily</span>
      <span>Weekly</span>
      <span>Monthly</span>
    </div>
    ${CATEGORIES.map(cat => `
    <div class="budget-limit-row">
      <label class="budget-limit-label">
        <span>${CAT_EMOJI[cat]||''} ${cat}</span>
      </label>
      ${BUDGET_PERIODS.map(period => `
        <label class="budget-limit-field">
          <span class="budget-period-mobile-label">${period}</span>
          <span class="budget-currency">Rs.</span>
          <input class="form-input budget-limit-input"
            type="number" min="0" step="100"
            id="budget-${period}-${cat.toLowerCase()}"
            data-cat="${cat}"
            data-period="${period}"
            placeholder="No limit"
            value="${budgets[period]?.[cat] || ''}"/>
        </label>`).join('')}
    </div>`).join('')}`;
}

// ── DOMContentLoaded ────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  // Load profile
  const user = getUser();
  if (user) {
    const nameEl  = document.getElementById('prof-name');
    const emailEl = document.getElementById('prof-email');
    if (nameEl)  nameEl.value  = user.name  || '';
    if (emailEl) emailEl.value = user.email || '';
  }

  // Load budgets from DB first, then render
  await fetchBudgetsFromDB();
  renderBudgetLimits();

  // Save profile
  document.getElementById('profile-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('prof-name').value.trim();
    if (!name) return;
    const user = getUser();
    const updated = { ...user, name };
    localStorage.setItem(STORAGE.USER, JSON.stringify(updated));

    const msg = document.getElementById('settings-success');
    if (msg) { msg.textContent = '✓ Profile saved!'; msg.classList.remove('hidden'); }
    initSidebar();
    setTimeout(() => msg?.classList.add('hidden'), 3000);
  });

  // Save budgets → localStorage + DB
  document.getElementById('save-budgets-btn')?.addEventListener('click', async () => {
    const budgets = { daily: {}, weekly: {}, monthly: {} };
    document.querySelectorAll('.budget-limit-input').forEach(input => {
      const val = parseFloat(input.value);
      if (val > 0) budgets[input.dataset.period][input.dataset.cat] = val;
    });

    // Save locally immediately (fast UI)
    saveBudgets(budgets);

    const btn = document.getElementById('save-budgets-btn');
    if (btn) btn.textContent = 'Saving…';

    // Persist to DB
    const ok = await saveBudgetsToDB(budgets);

    if (btn) {
      btn.textContent = ok ? '✓ Saved!' : '⚠ Local only (DB error)';
      setTimeout(() => btn.textContent = 'Save All Limits', 2000);
    }
  });

  // Clear data
  document.getElementById('clear-data-btn')?.addEventListener('click', async () => {
    if (!confirm('This will permanently delete ALL your income, expenses and budgets. Are you sure?')) return;
    localStorage.removeItem(STORAGE.INCOME);
    localStorage.removeItem(STORAGE.EXPENSES);
    localStorage.removeItem(STORAGE.BUDGETS);
    // Also wipe budgets on server.
    await saveBudgetsToDB({ daily: {}, weekly: {}, monthly: {} });
    alert('All data cleared.');
    renderBudgetLimits();
  });
});
