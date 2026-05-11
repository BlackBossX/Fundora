/**
 * income.js — Income page logic
 */

function renderIncomeTable() {
  const tbody = document.getElementById('income-table-body');
  if (!tbody) return;

  const income = getIncome();

  // Stats
  const thisMonth = income.filter(i => isThisMonth(i.date)).reduce((s,i) => s+parseFloat(i.amount),0);
  const allTime   = income.reduce((s,i) => s+parseFloat(i.amount), 0);

  const el1 = document.getElementById('income-this-month');
  const el2 = document.getElementById('income-count');
  const el3 = document.getElementById('income-alltime');
  if (el1) el1.textContent = formatRs(thisMonth);
  if (el2) el2.textContent = income.length;
  if (el3) el3.textContent = formatRs(allTime);

  if (!income.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding:32px;">No income entries yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = income.map(i => `
    <tr>
      <td>${formatDate(i.date)}</td>
      <td><strong>${i.source}</strong></td>
      <td class="text-muted">${i.notes||'—'}</td>
      <td class="text-right type-income">+${formatRs(i.amount)}</td>
      <td>
        <button class="btn btn--danger btn--sm" onclick="handleDeleteIncome(${i.id})">Delete</button>
      </td>
    </tr>`).join('');
}

function handleDeleteIncome(id) {
  if (!confirm('Delete this income entry?')) return;
  deleteIncome(id);
  renderIncomeTable();
}

// Modal
document.addEventListener('DOMContentLoaded', () => {
  renderIncomeTable();

  const openBtn   = document.getElementById('open-income-modal');
  const closeBtn  = document.getElementById('close-income-modal');
  const cancelBtn = document.getElementById('cancel-income-modal');
  const form      = document.getElementById('income-form');
  const dateInput = document.getElementById('inc-date');

  // Default date to today
  if (dateInput) dateInput.value = new Date().toISOString().slice(0,10);

  if (openBtn)   openBtn.addEventListener('click',   () => openModal('income-modal'));
  if (closeBtn)  closeBtn.addEventListener('click',  () => closeModal('income-modal'));
  if (cancelBtn) cancelBtn.addEventListener('click', () => closeModal('income-modal'));

  // Close on overlay click
  document.getElementById('income-modal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal('income-modal');
  });

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const source = document.getElementById('inc-source').value.trim();
      const amount = parseFloat(document.getElementById('inc-amount').value);
      const date   = document.getElementById('inc-date').value;
      const notes  = document.getElementById('inc-notes').value.trim();

      if (!source || !amount || !date) return;

      addIncome({ source, amount, date, notes });
      form.reset();
      if (dateInput) dateInput.value = new Date().toISOString().slice(0,10);
      closeModal('income-modal');
      renderIncomeTable();
    });
  }
});
