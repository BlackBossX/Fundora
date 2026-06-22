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

  // Savings goals
  renderDashboardGoals();

  // Recent transactions
  renderRecentTransactions();

  // Charts
  initCharts();
}

async function renderDashboardGoals() {
  const container = document.getElementById('dashboard-goals');
  if (!container) return;

  try {
    const response = await fetch('php/goals.php?action=fetch_all&_=' + Date.now());
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Unable to load goals');

    const monthGoalCashMovement = Number(data.current_month_goal_cash_movement || 0);
    const availableBalance = totalIncome(true) - totalExpenses(true) - monthGoalCashMovement;
    const balanceEl = document.getElementById('stat-balance');
    balanceEl.textContent = formatRs(availableBalance);
    balanceEl.style.color = availableBalance >= 0 ? 'var(--color-success)' : 'var(--color-danger)';

    const goals = data.goals
      .filter(goal => goal.status === 'Active')
      .slice(0, 3);

    if (!goals.length) {
      container.innerHTML = `<p class="text-muted">No active savings goals. <a href="goals.html">Create one →</a></p>`;
      return;
    }

    container.innerHTML = goals.map(goal => {
      const target = Number(goal.target_amount);
      const saved = Math.max(0, Number(goal.saved_amount));
      const remaining = Math.max(0, target - saved);
      const percent = target > 0 ? Math.min(100, saved / target * 100) : 0;
      return `<a class="dashboard-goal" href="goals.html">
        <div class="dashboard-goal__header"><strong>${escapeDashboardHtml(goal.name)}</strong><span>${percent.toFixed(0)}%</span></div>
        <div class="dashboard-goal__meta"><span>${formatRs(target)} target</span><span class="badge badge--primary">${goal.status}</span></div>
        <div class="progress-bar"><div class="progress-bar__fill" style="width:${percent}%"></div></div>
        <div class="dashboard-goal__footer"><span>${formatRs(saved)} saved · ${formatRs(remaining)} remaining</span><span>${formatDate(goal.target_date)}</span></div>
      </a>`;
    }).join('');
  } catch (error) {
    container.innerHTML = `<p class="text-muted">Goals are unavailable until the database migration is installed.</p>`;
  }
}

function escapeDashboardHtml(value = '') {
  const div = document.createElement('div');
  div.textContent = value;
  return div.innerHTML;
}

function renderBudgetProgress() {
  const container = document.getElementById('budget-progress-list');
  if (!container) return;

  const budgets = getBudgets();
  const periods = [
    ['daily', 'Daily'],
    ['weekly', 'Weekly'],
    ['monthly', 'Monthly'],
  ];
  const hasBudgets = periods.some(([period]) => Object.keys(budgets[period] || {}).length);

  if (!hasBudgets) {
    container.innerHTML = `<p class="text-muted">No budget limits set. <a href="settings.html">Set limits →</a></p>`;
    return;
  }

  container.innerHTML = periods.map(([period, label]) => {
    const periodBudgets = budgets[period] || {};
    if (!Object.keys(periodBudgets).length) return '';

    const catSpend = expensesByCategoryForPeriod(period);
    const items = Object.entries(periodBudgets).map(([cat, limit]) => {
      const spent = catSpend[cat] || 0;
      const rawPct = limit > 0 ? (spent / limit) * 100 : 0;
      const width = Math.min(rawPct, 100);
      const cls = rawPct >= 100 ? 'danger' : rawPct >= 80 ? 'warning' : '';

      return `
        <div class="budget-item">
          <div class="budget-item__header">
            <span class="budget-item__category">${CAT_EMOJI[cat]||''} ${cat}</span>
            <span class="budget-item__amounts">${formatRs(spent)} / ${formatRs(limit)}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-bar__fill ${cls ? 'progress-bar__fill--'+cls : ''}" style="width:${width}%"></div>
          </div>
        </div>`;
    }).join('');

    return `<section class="budget-period-group">
      <h4 class="budget-period-title">${label} limits</h4>
      ${items}
    </section>`;
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

document.addEventListener('DOMContentLoaded', () => {
  renderDashboard();
  window.addEventListener('transactionsSynced', renderDashboard);
  window.addEventListener('budgetsSynced',      renderDashboard);
});
