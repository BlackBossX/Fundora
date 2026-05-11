/**
 * history.js — Transaction history with search and filters
 */

function renderHistory() {
  const tbody    = document.getElementById('history-table-body');
  const countEl  = document.getElementById('hist-count');
  if (!tbody) return;

  const search   = document.getElementById('hist-search')?.value.toLowerCase() || '';
  const typeF    = document.getElementById('hist-type')?.value  || 'all';
  const fromDate = document.getElementById('hist-from')?.value  || '';
  const toDate   = document.getElementById('hist-to')?.value    || '';

  let txns = allTransactionsSorted();

  if (typeF !== 'all') txns = txns.filter(t => t.type === typeF);
  if (fromDate)        txns = txns.filter(t => t.date >= fromDate);
  if (toDate)          txns = txns.filter(t => t.date <= toDate);
  if (search) {
    txns = txns.filter(t => {
      const haystack = [t.source, t.category, t.description, t.notes, t.date].join(' ').toLowerCase();
      return haystack.includes(search);
    });
  }

  if (countEl) countEl.textContent = `${txns.length} transaction${txns.length !== 1 ? 's' : ''}`;

  if (!txns.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted" style="padding:32px;">No transactions match your filters.</td></tr>`;
    return;
  }

  tbody.innerHTML = txns.map(t => {
    const isInc = t.type === 'income';
    const label = isInc ? t.source : `${CAT_EMOJI[t.category]||''} ${t.category}`;
    const desc  = isInc ? (t.notes||'—') : (t.description||'—');
    const amt   = isInc
      ? `<span class="type-income">+${formatRs(t.amount)}</span>`
      : `<span class="type-expense">−${formatRs(t.amount)}</span>`;

    return `<tr>
      <td>${formatDate(t.date)}</td>
      <td><span class="badge badge--${isInc?'success':'danger'}">${isInc?'Income':'Expense'}</span></td>
      <td>${label}</td>
      <td class="text-muted">${desc}</td>
      <td class="text-right">${amt}</td>
      <td>
        <button class="btn btn--danger btn--sm"
          onclick="handleDeleteTxn('${t.type}', ${t.id})">Delete</button>
      </td>
    </tr>`;
  }).join('');
}

function handleDeleteTxn(type, id) {
  if (!confirm('Delete this transaction?')) return;
  if (type === 'income') deleteIncome(id);
  else deleteExpense(id);
  renderHistory();
}

document.addEventListener('DOMContentLoaded', () => {
  renderHistory();

  ['hist-search','hist-type','hist-from','hist-to'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', renderHistory);
    document.getElementById(id)?.addEventListener('change', renderHistory);
  });

  document.getElementById('hist-clear-btn')?.addEventListener('click', () => {
    ['hist-search','hist-from','hist-to'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const typeEl = document.getElementById('hist-type');
    if (typeEl) typeEl.value = 'all';
    renderHistory();
  });
});
