/**
 * transactions.js — CRUD for income & expenses via localStorage
 * For production: replace with fetch() calls to php/transactions.php
 */

// ── Data Access ────────────────────────────────────────────────
function getIncome()   { return JSON.parse(localStorage.getItem(STORAGE.INCOME)   || '[]'); }
function getExpenses() { return JSON.parse(localStorage.getItem(STORAGE.EXPENSES) || '[]'); }
function getBudgets()  { return JSON.parse(localStorage.getItem(STORAGE.BUDGETS)  || '{}'); }

function saveIncome(data)   { localStorage.setItem(STORAGE.INCOME,   JSON.stringify(data)); }
function saveExpenses(data) { localStorage.setItem(STORAGE.EXPENSES, JSON.stringify(data)); }
function saveBudgets(data)  { localStorage.setItem(STORAGE.BUDGETS,  JSON.stringify(data)); }

// ── Income CRUD ────────────────────────────────────────────────
function addIncome(entry) {
  const income = getIncome();
  entry.id = Date.now();
  income.unshift(entry);
  saveIncome(income);
  return entry;
}

function deleteIncome(id) {
  const income = getIncome().filter(i => i.id !== id);
  saveIncome(income);
}

// ── Expense CRUD ───────────────────────────────────────────────
function addExpense(entry) {
  const expenses = getExpenses();
  entry.id = Date.now();
  expenses.unshift(entry);
  saveExpenses(expenses);
  return entry;
}

function deleteExpense(id) {
  const expenses = getExpenses().filter(e => e.id !== id);
  saveExpenses(expenses);
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
