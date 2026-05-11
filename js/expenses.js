/**
 * expenses.js — Expenses page logic
 */

let currentFilter = 'all';

function renderExpenseTable() {
  const tbody = document.getElementById('expense-table-body');
  if (!tbody) return;

  let expenses = getExpenses();
  if (currentFilter !== 'all') expenses = expenses.filter(e => e.category === currentFilter);

  // Stats (always full)
  const all      = getExpenses();
  const thisM    = all.filter(e => isThisMonth(e.date)).reduce((s,e)=>s+parseFloat(e.amount),0);
  const topCat   = Object.entries(expensesByCategory(true)).sort((a,b)=>b[1]-a[1])[0];

  const el1 = document.getElementById('expense-this-month');
  const el2 = document.getElementById('expense-count');
  const el3 = document.getElementById('expense-top-cat');
  if (el1) el1.textContent = formatRs(thisM);
  if (el2) el2.textContent = all.length;
  if (el3) el3.textContent = topCat ? `${CAT_EMOJI[topCat[0]]||''} ${topCat[0]}` : '—';

  // Alerts
  checkBudgetAlerts('#expense-alerts');

  if (!expenses.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding:32px;">No expenses in this category.</td></tr>`;
    return;
  }

  tbody.innerHTML = expenses.map(e => `
    <tr>
      <td>${formatDate(e.date)}</td>
      <td><span class="badge badge--danger">${CAT_EMOJI[e.category]||''} ${e.category}</span></td>
      <td class="text-muted">${e.description||'—'}</td>
      <td class="text-right type-expense">−${formatRs(e.amount)}</td>
      <td>
        <button class="btn btn--danger btn--sm" onclick="handleDeleteExpense(${e.id})">Delete</button>
      </td>
    </tr>`).join('');
}

function handleDeleteExpense(id) {
  if (!confirm('Delete this expense?')) return;
  deleteExpense(id);
  renderExpenseTable();
}

document.addEventListener('DOMContentLoaded', () => {
  renderExpenseTable();

  // Category filters
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.cat;
      renderExpenseTable();
    });
  });

  // Modal
  const openBtn   = document.getElementById('open-expense-modal');
  const closeBtn  = document.getElementById('close-expense-modal');
  const cancelBtn = document.getElementById('cancel-expense-modal');
  const form      = document.getElementById('expense-form');
  const dateInput = document.getElementById('exp-date');

  if (dateInput) dateInput.value = new Date().toISOString().slice(0,10);

  if (openBtn)   openBtn.addEventListener('click',   () => openModal('expense-modal'));
  if (closeBtn)  closeBtn.addEventListener('click',  () => closeModal('expense-modal'));
  if (cancelBtn) cancelBtn.addEventListener('click', () => closeModal('expense-modal'));

  document.getElementById('expense-modal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal('expense-modal');
  });

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const category    = document.getElementById('exp-category').value;
      const amount      = parseFloat(document.getElementById('exp-amount').value);
      const description = document.getElementById('exp-description').value.trim();
      const date        = document.getElementById('exp-date').value;

      if (!category || !amount || !date) return;

      addExpense({ category, amount, description, date });
      form.reset();
      if (dateInput) dateInput.value = new Date().toISOString().slice(0,10);
      closeModal('expense-modal');
      renderExpenseTable();
    });
  }
});
