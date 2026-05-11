/**
 * dashboard.js — Dashboard page logic
 */

function renderDashboard() {
  // Stats
  const inc  = totalIncome(true);
  const exp  = totalExpenses(true);
  const bal  = inc - exp;

  document.getElementById('stat-income').textContent  = formatRs(inc);
  document.getElementById('stat-expense').textContent = formatRs(exp);
  document.getElementById('stat-balance').textContent = formatRs(bal);
  document.getElementById('stat-balance').style.color =
    bal >= 0 ? 'var(--color-success)' : 'var(--color-danger)';

  // Alerts count
  const alertCount = checkBudgetAlerts('#alerts-container');
  document.getElementById('stat-alerts').textContent = alertCount;

  // Budget Progress
  renderBudgetProgress();

  // Recent transactions
  renderRecentTransactions();

  // Charts
  initCharts();
}

function renderBudgetProgress() {
  const container = document.getElementById('budget-progress-list');
  if (!container) return;

  const budgets  = getBudgets();
  const catSpend = expensesByCategory(true);

  if (!Object.keys(budgets).length) {
    container.innerHTML = `<p class="text-muted">No budget limits set. <a href="settings.html">Set limits →</a></p>`;
    return;
  }

  container.innerHTML = Object.entries(budgets).map(([cat, limit]) => {
    const spent = catSpend[cat] || 0;
    const pct   = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
    const cls   = pct >= 100 ? 'danger' : pct >= 80 ? 'warning' : '';

    return `
      <div class="budget-item">
        <div class="budget-item__header">
          <span class="budget-item__category">${CAT_EMOJI[cat]||''} ${cat}</span>
          <span class="budget-item__amounts">${formatRs(spent)} / ${formatRs(limit)}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-bar__fill ${cls ? 'progress-bar__fill--'+cls : ''}" style="width:${pct}%"></div>
        </div>
      </div>`;
  }).join('');
}

function renderRecentTransactions() {
  const tbody = document.getElementById('recent-transactions');
  if (!tbody) return;

  const txns = allTransactionsSorted().slice(0, 8);

  if (!txns.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding:32px;">No transactions yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = txns.map(t => {
    const isInc  = t.type === 'income';
    const label  = isInc ? t.source : (CAT_EMOJI[t.category]||'') + ' ' + t.category;
    const desc   = isInc ? (t.notes||'—') : (t.description||'—');
    const amt    = isInc ? `<span class="type-income">+${formatRs(t.amount)}</span>`
                         : `<span class="type-expense">−${formatRs(t.amount)}</span>`;
    return `<tr>
      <td>${formatDate(t.date)}</td>
      <td><span class="badge badge--${isInc?'success':'danger'}">${isInc?'Income':'Expense'}</span></td>
      <td>${label}</td>
      <td class="text-muted">${desc}</td>
      <td class="text-right">${amt}</td>
    </tr>`;
  }).join('');
}

document.addEventListener('DOMContentLoaded', renderDashboard);
