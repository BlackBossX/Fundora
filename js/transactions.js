/**
 * transactions.js — CRUD for income & expenses via localStorage + PHP backend
 */

// ── Data Access ────────────────────────────────────────────────
function getIncome()   { return JSON.parse(localStorage.getItem(STORAGE.INCOME)   || '[]'); }
function getExpenses() { return JSON.parse(localStorage.getItem(STORAGE.EXPENSES) || '[]'); }
function getBudgets()  { return JSON.parse(localStorage.getItem(STORAGE.BUDGETS)  || '{}'); }

function saveIncome(data)   { localStorage.setItem(STORAGE.INCOME,   JSON.stringify(data)); }
function saveExpenses(data) { localStorage.setItem(STORAGE.EXPENSES, JSON.stringify(data)); }
function saveBudgets(data)  { localStorage.setItem(STORAGE.BUDGETS,  JSON.stringify(data)); }

// ── Mutation guard ─────────────────────────────────────────────
// Tracks how many add/delete operations are currently in-flight.
// syncTransactions must NOT overwrite localStorage while this is > 0.
let _mutationsInFlight = 0;

// ── Backend Sync ───────────────────────────────────────────────
async function syncTransactions() {
  // Don't let a background sync clobber data from an in-progress write
  if (_mutationsInFlight > 0) return;
  try {
    const res = await fetch('php/transactions.php?action=fetch_all&_=' + Date.now());
    const data = await res.json();
    // Double-check: a mutation may have started while we were awaiting the response
    if (data.success && _mutationsInFlight === 0) {
      saveIncome(data.income);
      saveExpenses(data.expenses);
      window.dispatchEvent(new Event('transactionsSynced'));
    }
  } catch (e) {
    console.error("Failed to sync transactions", e);
  }
}

// ── Income CRUD ────────────────────────────────────────────────
async function addIncome(entry) {
  _mutationsInFlight++;
  try {
    const res = await fetch('php/transactions.php?action=add_income', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(entry)
    });
    const data = await res.json();
    if (data.success) {
      entry.id = data.id;
      const income = getIncome();
      income.unshift(entry);
      saveIncome(income);
      _mutationsInFlight--;
      // Re-sync from DB after write so localStorage is always authoritative
      syncTransactions();
      return entry;
    } else {
      _mutationsInFlight--;
    }
  } catch (e) {
    _mutationsInFlight--;
    console.error(e);
  }
}

async function deleteIncome(id) {
  _mutationsInFlight++;
  try {
    const res = await fetch('php/transactions.php?action=delete_income', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ id })
    });
    const data = await res.json();
    if (data.success) {
      const income = getIncome().filter(i => String(i.id) !== String(id));
      saveIncome(income);
    }
    _mutationsInFlight--;
    syncTransactions();
  } catch (e) {
    _mutationsInFlight--;
    console.error(e);
  }
}

// ── Expense CRUD ───────────────────────────────────────────────
async function addExpense(entry) {
  _mutationsInFlight++;
  try {
    const res = await fetch('php/transactions.php?action=add_expense', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(entry)
    });
    const data = await res.json();
    if (data.success) {
      entry.id = data.id;
      const expenses = getExpenses();
      expenses.unshift(entry);
      saveExpenses(expenses);
      _mutationsInFlight--;
      syncTransactions();
      return entry;
    } else {
      _mutationsInFlight--;
    }
  } catch (e) {
    _mutationsInFlight--;
    console.error(e);
  }
}

async function deleteExpense(id) {
  _mutationsInFlight++;
  try {
    const res = await fetch('php/transactions.php?action=delete_expense', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ id })
    });
    const data = await res.json();
    if (data.success) {
      const expenses = getExpenses().filter(e => String(e.id) !== String(id));
      saveExpenses(expenses);
    }
    _mutationsInFlight--;
    syncTransactions();
  } catch (e) {
    _mutationsInFlight--;
    console.error(e);
  }
}

// ── Aggregation Helpers ────────────────────────────────────────
function totalIncome(month = true) {
  return getIncome()
    .filter(i => !month || isThisMonth(i.date))
    .reduce((sum, i) => sum + parseFloat(i.amount), 0);
}

function totalExpenses(month = true) {
  return getExpenses()
    .filter(e => !month || isThisMonth(e.date))
    .reduce((sum, e) => sum + parseFloat(e.amount), 0);
}

function expensesByCategory(month = true) {
  const map = {};
  getExpenses()
    .filter(e => !month || isThisMonth(e.date))
    .forEach(e => {
      map[e.category] = (map[e.category] || 0) + parseFloat(e.amount);
    });
  return map;
}

function allTransactionsSorted() {
  const income   = getIncome().map(i   => ({ ...i, type: 'income'  }));
  const expenses = getExpenses().map(e => ({ ...e, type: 'expense' }));
  return [...income, ...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
}
