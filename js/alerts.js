/**
 * alerts.js — Budget alert logic
 * Checks spending vs budget limits and renders warning banners
 */

function checkBudgetAlerts(containerSelector = '#alerts-container') {
  const container = document.querySelector(containerSelector);
  if (!container) return 0;

  const budgets  = getBudgets();
  const catSpend = expensesByCategory(true);
  const alerts   = [];

  Object.entries(budgets).forEach(([cat, limit]) => {
    const spent   = catSpend[cat] || 0;
    const pct     = limit > 0 ? (spent / limit) * 100 : 0;
    if (pct >= 80) {
      alerts.push({ cat, spent, limit, pct });
    }
  });

  container.innerHTML = '';
  alerts.forEach(({ cat, spent, limit, pct }) => {
    const type  = pct >= 100 ? 'danger' : 'warning';
    const label = pct >= 100 ? '🚨 Over budget' : '⚠️ Near limit';
    const div   = document.createElement('div');
    div.className = `alert alert--${type} mb-sm`;
    div.innerHTML = `<strong>${label} — ${CAT_EMOJI[cat] || ''} ${cat}:</strong>&nbsp;
      Spent ${formatRs(spent)} of ${formatRs(limit)} (${pct.toFixed(0)}%)`;
    container.appendChild(div);
  });

  return alerts.length;
}
