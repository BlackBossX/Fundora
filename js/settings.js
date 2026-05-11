/**
 * settings.js — Settings page logic
 */

const CATEGORIES = ['Food','Transport','Rent','Entertainment','Health','Education','Other'];

function renderBudgetLimits() {
  const grid = document.getElementById('budget-limits-grid');
  if (!grid) return;

  const budgets = getBudgets();

  grid.innerHTML = CATEGORIES.map(cat => `
    <div class="budget-limit-row">
      <label class="budget-limit-label">
        <span>${CAT_EMOJI[cat]||''} ${cat}</span>
      </label>
      <div style="display:flex;align-items:center;gap:10px;margin-left:auto;">
        <span style="color:var(--color-text-muted);font-size:0.85rem;">Rs.</span>
        <input class="form-input budget-limit-input"
          type="number" min="0" step="100"
          id="budget-${cat.toLowerCase()}"
          data-cat="${cat}"
          placeholder="No limit"
          value="${budgets[cat] || ''}"
          style="max-width:160px;"/>
      </div>
    </div>`).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  // Load profile
  const user = getUser();
  if (user) {
    const nameEl  = document.getElementById('prof-name');
    const emailEl = document.getElementById('prof-email');
    if (nameEl)  nameEl.value  = user.name  || '';
    if (emailEl) emailEl.value = user.email || '';
  }

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

  // Save budgets
  document.getElementById('save-budgets-btn')?.addEventListener('click', () => {
    const budgets = {};
    document.querySelectorAll('.budget-limit-input').forEach(input => {
      const val = parseFloat(input.value);
      if (val > 0) budgets[input.dataset.cat] = val;
    });
    saveBudgets(budgets);

    const btn = document.getElementById('save-budgets-btn');
    if (btn) {
      btn.textContent = '✓ Saved!';
      setTimeout(() => btn.textContent = 'Save All Limits', 2000);
    }
  });

  // Clear data
  document.getElementById('clear-data-btn')?.addEventListener('click', () => {
    if (!confirm('This will permanently delete ALL your income, expenses and budgets. Are you sure?')) return;
    localStorage.removeItem(STORAGE.INCOME);
    localStorage.removeItem(STORAGE.EXPENSES);
    localStorage.removeItem(STORAGE.BUDGETS);
    alert('All data cleared.');
    renderBudgetLimits();
  });
});
