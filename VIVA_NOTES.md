# Fundora — Viva Notes & Project Documentation

> **COSC 31103 / BECS 31233 — Web Technologies | University of Kelaniya, ECS**  
> Smart Student Finance Tracker · Built with HTML, CSS, JavaScript & PHP + MySQL

---

## 1. Project Overview

**Fundora** is a full-stack personal finance web application designed for university students. It allows users to:
- Track income and expenses
- Set spending budgets per category (daily / weekly / monthly)
- Monitor savings goals with automatic contributions
- Receive bill payment reminders
- Visualize financial data through interactive charts

**Tech Stack:**
| Layer | Technology |
|---|---|
| Frontend | HTML5, Vanilla CSS, Vanilla JavaScript |
| Backend | PHP 8+ (procedural, no framework) |
| Database | MySQL (hosted on InfinityFree) |
| Charts | Chart.js (CDN) |
| Auth | PHP Sessions + `localStorage` |

---

## 2. Project File Structure

```
Fundora/
├── index.html              ← Public landing page
├── login.html              ← Login page
├── register.html           ← Registration page
│
├── app/                    ← Protected app pages (all require login)
│   ├── dashboard.html
│   ├── income.html
│   ├── expenses.html
│   ├── history.html
│   ├── goals.html
│   ├── bills.html
│   └── settings.html
│
├── php/                    ← Backend API endpoints
│   ├── db.php              ← PDO database connection + session_start()
│   ├── auth.php            ← Register / Login / Logout
│   ├── transactions.php    ← Income & Expense CRUD
│   ├── budgets.php         ← Budget fetch & save
│   ├── goals.php           ← Savings Goals & Contributions CRUD
│   └── bills.php           ← Bills & Bill Payments CRUD
│
├── assets/
│   ├── css/
│   │   ├── style.css       ← Global design system (tokens, components)
│   │   ├── landing.css     ← Landing page specific styles
│   │   ├── dashboard.css   ← Dashboard specific styles
│   │   ├── goals.css       ← Goals page specific styles
│   │   ├── bills.css       ← Bills page specific styles
│   │   ├── auth.css        ← Login/Register styles
│   │   └── settings.css    ← Settings page styles
│   └── js/
│       ├── app.js          ← Core utilities: auth guard, sidebar, formatters
│       ├── auth.js         ← Login & Register form logic
│       ├── transactions.js ← Data layer: CRUD + sync for income/expenses
│       ├── alerts.js       ← Budget alert rendering logic
│       ├── charts.js       ← Chart.js chart initialization
│       ├── dashboard.js    ← Dashboard page rendering
│       ├── income.js       ← Income page form & list
│       ├── expenses.js     ← Expenses page form & list
│       ├── history.js      ← Transaction history filter/search
│       ├── goals.js        ← Full savings goals CRUD + charts
│       ├── bills.js        ← Bills CRUD + reminders
│       └── settings.js     ← Profile + budget settings
│
└── database/
    ├── schema/
    │   └── database.sql                    ← Full DB schema (all tables)
    └── migrations/
        ├── migrate_bill_reminders.sql
        ├── migrate_budget_periods.sql
        ├── migrate_goals_savings.sql
        └── migrate_net_goal_contributions.sql
```

---

## 3. Database Schema & Relations

### Tables Overview

```
users
  └─< income              (user_id → users.id)
  └─< expenses            (user_id → users.id)
  └─< budgets             (user_id → users.id)
  └─< savings_goals       (user_id → users.id)
      └─< goal_contributions (goal_id → savings_goals.id, user_id → users.id)
  └─< bills               (user_id → users.id)
      └─< bill_payments   (bill_id → bills.id, user_id → users.id)
```

All child tables use `ON DELETE CASCADE` — deleting a user removes all their data automatically.

### Table Definitions

#### `users`
| Column | Type | Notes |
|---|---|---|
| id | INT PK AUTO_INCREMENT | |
| name | VARCHAR(100) | |
| email | VARCHAR(150) UNIQUE | |
| password | VARCHAR(255) | bcrypt hashed |
| created_at | TIMESTAMP | |

#### `income`
| Column | Type | Notes |
|---|---|---|
| id | INT PK | |
| user_id | INT FK | → users.id |
| source | VARCHAR(100) | e.g., "Salary", "Freelance" |
| amount | DECIMAL(10,2) | |
| date | DATE | |
| notes | TEXT | |

#### `expenses`
| Column | Type | Notes |
|---|---|---|
| id | INT PK | |
| user_id | INT FK | |
| category | ENUM | Food, Transport, Rent, Entertainment, Health, Education, Other |
| amount | DECIMAL(10,2) | |
| description | VARCHAR(255) | |
| date | DATE | |

#### `budgets`
| Column | Type | Notes |
|---|---|---|
| id | INT PK | |
| user_id | INT FK | |
| category | ENUM | Same 7 categories as expenses |
| period | ENUM | 'daily', 'weekly', 'monthly' |
| amount | DECIMAL(10,2) | Budget limit |
| UNIQUE KEY | (user_id, category, period) | One limit per category per period |

#### `savings_goals`
| Column | Type | Notes |
|---|---|---|
| id | INT PK | |
| user_id | INT FK | |
| name | VARCHAR(120) | |
| category | ENUM | Emergency, Education, Travel, Technology, Vehicle, Home, Investment, Other |
| target_amount | DECIMAL(12,2) | |
| target_date | DATE | |
| priority | ENUM | High, Medium, Low |
| status | ENUM | Active, Completed, Paused, Cancelled |
| auto_contribution_amount | DECIMAL(12,2) | 0 = disabled |
| auto_contribution_day | TINYINT | Day of month (1–28) |
| next_auto_contribution_date | DATE NULL | Next scheduled auto-deposit |

#### `goal_contributions`
| Column | Type | Notes |
|---|---|---|
| id | INT PK | |
| goal_id | INT FK | → savings_goals.id |
| user_id | INT FK | → users.id |
| type | ENUM | Deposit, NetTransfer, Withdrawal, Automatic |
| amount | DECIMAL(12,2) | |
| contribution_date | DATE | |
| notes | VARCHAR(255) | |

#### `bills`
| Column | Type | Notes |
|---|---|---|
| id | INT PK | |
| user_id | INT FK | |
| name | VARCHAR(120) | |
| category | ENUM | Utilities, Housing, Internet, Loan, Insurance, Education, Subscription, Other |
| amount_due | DECIMAL(12,2) | |
| due_date | DATE | |
| recurrence | ENUM | One-time, Weekly, Monthly, Quarterly, Yearly, Custom |
| custom_interval_days | INT NULL | Used when recurrence = 'Custom' |
| reminder_offsets | VARCHAR(100) | Comma-separated days before due (e.g., "0,1,7") |
| status | ENUM | Active, Paid, Cancelled |

#### `bill_payments`
| Column | Type | Notes |
|---|---|---|
| id | INT PK | |
| bill_id | INT FK | → bills.id |
| user_id | INT FK | |
| amount_paid | DECIMAL(12,2) | |
| payment_date | DATE | |
| due_date_paid | DATE | The due date this payment covers |

---

## 4. Backend PHP — API Endpoints

Every PHP file follows the same pattern:
1. `require 'db.php'` → establishes PDO connection + starts session
2. Checks `$_SESSION['user_id']` → returns 401 JSON if missing
3. Reads `$_GET['action']` to route the request
4. Returns `{"success": true/false, ...data}` JSON always

### `db.php` — Database Connection
```php
$pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
session_start();
```
- Uses **PDO** (PHP Data Objects) for safe, parameterized queries
- `session_start()` is called here so every included file has sessions

### `auth.php` — Authentication
| Method | Action | What it does |
|---|---|---|
| POST | `?action=register` | Hashes password with `PASSWORD_BCRYPT`, inserts user |
| POST | `?action=login` | Fetches user by email, `password_verify()`, sets `$_SESSION['user_id']` |
| GET | `?action=logout` | `session_destroy()` |

**Key:** Password is **never stored plain**. `password_hash()` + `password_verify()` are PHP built-ins for bcrypt.

### `transactions.php` — Income & Expense CRUD
| Method | Action | What it does |
|---|---|---|
| GET | `fetch_all` | Returns all income[] and expenses[] for the user |
| POST | `add_income` | Inserts row, returns new `id` |
| POST | `add_expense` | Inserts row, returns new `id` |
| POST | `delete_income` | DELETE WHERE id=? AND user_id=? (ownership check) |
| POST | `delete_expense` | DELETE WHERE id=? AND user_id=? |

### `budgets.php` — Budget Management
| Method | Action | What it does |
|---|---|---|
| GET | `fetch` | Returns `{daily:{}, weekly:{}, monthly:{}}` structure |
| POST | `save` | DELETE all user's budgets, re-inserts from JSON body (atomic transaction) |

The `save` action uses a **database transaction** (`beginTransaction` / `commit` / `rollBack`) to atomically replace all budgets.

### `goals.php` — Savings Goals (most complex)
| Method | Action | What it does |
|---|---|---|
| GET | `fetch_all` | Triggers auto-contributions, returns goals + contributions + available_net_amount |
| POST | `create_goal` | Insert new goal, optionally adds initial deposit contribution |
| POST | `update_goal` | Update goal fields, preserves auto date if unchanged |
| POST | `delete_goal` | Cascade deletes all contributions too |
| POST | `add_contribution` | Validates balance/net-amount, inserts contribution |
| POST | `update_contribution` | Re-validates, updates (cannot edit Automatic type) |
| POST | `delete_contribution` | Cannot delete Automatic contributions |

**Key functions in goals.php:**
- `availableNetAmount()` — `income − expenses − all_NetTransfer_contributions` — prevents overspending into goals
- `currentMonthGoalCashMovement()` — used by dashboard to correctly show balance after goal transfers
- `processAutomaticContributions()` — runs on every fetch; checks if any goal's `next_auto_contribution_date <= today`, inserts missing automatic records, advances the date forward

### `bills.php` — Bill Reminders
| Method | Action | What it does |
|---|---|---|
| GET | `fetch_all` | Returns bills + payments + alerts + summary stats |
| POST | `create` | Creates a new bill |
| POST | `update` | Updates bill details |
| POST | `mark_paid` | Records payment; if recurring, advances `due_date` to next cycle |
| POST | `delete` | Hard deletes bill + cascade payments |

**`billAlerts()`** — Iterates active bills, calculates days until due, checks `reminder_offsets` array and `custom_reminder_dates`, returns alert objects with type `overdue/today/upcoming`.

**`nextBillDueDate()`** — Advances the due date based on recurrence type (Weekly +7 days, Monthly +1 month, Quarterly +3 months, Yearly +1 year, Custom +N days).

---

## 5. Frontend JavaScript — Logic & Data Flow

### `app.js` — Core Utilities (loaded on every app page)

**Path helpers:**
```js
const IS_APP = location.pathname.includes('/app/');
const ROOT   = IS_APP ? '../' : '';
function apiUrl(file) { return `${ROOT}php/${file}`; }
```
This allows pages inside `app/` to correctly reach `../php/` and pages at root to reach `php/`.

**Storage keys (localStorage):**
```js
STORAGE = {
  USER:     'fundora_user',
  INCOME:   'fundora_income',
  EXPENSES: 'fundora_expenses',
  BUDGETS:  'fundora_budgets'
}
```

**Auth guard:**
```js
function requireAuth() {
  if (!IS_APP) return;
  if (!getUser()) location.href = ROOT + 'login.html';
}
```
Called on `DOMContentLoaded` — redirects to login if no user in localStorage.

**`initSidebar()`** — Dynamically injects "Goals & Savings" and "Bill Reminders" nav links into the sidebar (if not already present), populates user name/avatar from localStorage.

### `auth.js` — Login & Register Forms

1. Intercepts form `submit` event
2. Sends `fetch()` POST to `php/auth.php?action=login` or `register`
3. On login success: stores `{id, name}` in `localStorage.setItem(STORAGE.USER, ...)`
4. Redirects to `app/dashboard.html`

### `transactions.js` — Data Layer (most important shared file)

This file is loaded on every app page. It provides:

**Data accessors:**
```js
getIncome()    // reads localStorage
getExpenses()  // reads localStorage
getBudgets()   // reads localStorage, upgrades old flat format
```

**Backend sync:**
```js
async function syncTransactions() { ... } // fetches from transactions.php, saves to localStorage
async function syncBudgets()      { ... } // fetches from budgets.php, saves to localStorage
```

**Mutation guard (`_mutationsInFlight`):**
> This is a key design decision. When a user adds/deletes a transaction, a background `syncTransactions()` could overwrite localStorage with stale data before the write completes. The counter `_mutationsInFlight` prevents sync from running while a write is in progress.

**CRUD functions:** `addIncome`, `deleteIncome`, `addExpense`, `deleteExpense` — each:
1. Increments `_mutationsInFlight`
2. POSTs to backend
3. Optimistically updates localStorage
4. Decrements counter
5. Re-syncs from DB to confirm

**Aggregation helpers:**
- `totalIncome(month)` — sums income, optionally filtered to current month
- `totalExpenses(month)` — same for expenses
- `expensesByCategory(month)` — `{Food: 1200, Transport: 450, ...}`
- `expensesByCategoryForPeriod(period)` — filters by 'daily', 'weekly', 'monthly' window
- `allTransactionsSorted()` — merges income+expenses, tags each with `type`, sorts by date DESC

### `alerts.js` — Budget Alert Engine

```js
function checkBudgetAlerts(containerSelector) {
  // For each period (daily/weekly/monthly):
  //   For each category with a budget limit:
  //     Calculate (spent / limit * 100)
  //     If >= 80% → push warning alert
  //     If >= 100% → push danger alert
  // Renders HTML alert divs into the container
  // Returns count of alerts
}
```

### `charts.js` — Chart.js Visualizations

Four charts are initialized by `initCharts()` on the dashboard:

| Chart | Type | Data Source |
|---|---|---|
| `pie-chart` | Doughnut | `expensesByCategory(true)` — this month's spending by category |
| `bar-chart` | Bar | Last 6 months income vs expenses (loops `getIncome()`/`getExpenses()`) |
| `today-cashflow-chart` | Bar | Today's income vs today's expenses |
| `today-category-chart` | Doughnut | Today's expenses by category |

Charts are destroyed and recreated on each call to prevent canvas reuse errors.

### `dashboard.js` — Dashboard Orchestration

`renderDashboard()` is the main function, called on load and when `transactionsSynced` or `budgetsSynced` events fire:

```
renderDashboard()
  ├── Display stat-income, stat-expense from localStorage
  ├── await renderDashboardGoals()   ← fetches goals.php (async)
  │     └── calls setDashboardBalance(monthGoalCashMovement)
  │         Balance = Income - Expenses - GoalCashMovement
  ├── checkBudgetAlerts()            ← from alerts.js
  ├── renderBudgetProgress()         ← progress bars for each period/category
  ├── await renderDashboardBills()   ← fetches bills.php (async)
  ├── renderRecentTransactions()     ← last 8 from allTransactionsSorted()
  └── initCharts()                   ← from charts.js
```

### `goals.js` — Savings Goals UI

State variables:
```js
let goals = [];              // all goals array
let contributions = [];      // all contributions array  
let selectedGoalId = null;   // currently open detail panel
let availableNetAmount = 0;  // from backend: income - expenses - transfers
```

**`goalMetrics(goal)`** — computes: `saved`, `remaining`, `percent`, `days`, `monthlyNeeded`, `weeklyNeeded`

**`savingsRate(goalId)`** — average monthly contribution rate over last 90 days

**`estimatedCompletion(goal)`** — projects completion month based on savings rate or auto-contribution amount

**`renderProgressChart()`** — renders a Chart.js line chart showing cumulative savings over time vs target

**Contribution types:**
- `Deposit` — just logs money to the goal (doesn't affect income/expense balance)
- `NetTransfer` — deducts from user's available net amount (income - expenses)
- `Withdrawal` — removes money from goal balance, returns to hand
- `Automatic` — system-generated, cannot be manually edited/deleted

### `settings.js` — Budget Settings

- Renders a grid of inputs: 7 categories × 3 periods = 21 input fields
- On save: reads all inputs → builds `{daily:{}, weekly:{}, monthly:{}}` → saves to localStorage immediately → POSTs to `budgets.php?action=save`
- Shows "Saving…" → "✓ Saved!" / "⚠ Local only (DB error)" feedback

---

## 6. Authentication Flow

```
[User visits app/dashboard.html]
        ↓
app.js: requireAuth()
        ↓
  getUser() checks localStorage['fundora_user']
        ↓
  null?  ──YES──→ redirect to login.html
        ↓ NO
  Continue loading page
        ↓
app.js: syncTransactions() + syncBudgets()
        ↓
  PHP checks $_SESSION['user_id']
  (session set at login time)
```

**Two-layer auth:**
1. **Client side**: `localStorage` user check in `requireAuth()` — fast, instant redirect
2. **Server side**: `$_SESSION['user_id']` check in every PHP file — actual security guard

**Why both?** The client check prevents the UI from even loading. The server check prevents direct API calls without a valid session.

---

## 7. Data Synchronization Strategy

Fundora uses a **localStorage-first, DB-backed** hybrid architecture:

```
[User Action]
      ↓
POST to PHP backend  ←── optimistic update to localStorage immediately
      ↓                   (UI stays fast)
PHP writes to MySQL
      ↓
syncTransactions() called
      ↓
GET from PHP backend → overwrites localStorage with DB truth
      ↓
Custom Event dispatched: 'transactionsSynced'
      ↓
dashboard.js listens → re-renders everything
```

**Why localStorage at all?**  
Avoids blocking the UI. User sees data immediately from cache; sync confirms it matches DB.

**`_mutationsInFlight` guard:**  
Prevents a background sync from overwriting localStorage while a write is still pending. Acts like a semaphore counter.

---

## 8. Page-by-Page Summary

| Page | HTML | JS Files Loaded | PHP Called |
|---|---|---|---|
| Landing | `index.html` | `app.js` | None |
| Login | `login.html` | `app.js`, `auth.js` | `auth.php?action=login` |
| Register | `register.html` | `app.js`, `auth.js` | `auth.php?action=register` |
| Dashboard | `app/dashboard.html` | `app.js`, `transactions.js`, `alerts.js`, `charts.js`, `dashboard.js` | `transactions.php`, `budgets.php`, `goals.php`, `bills.php` |
| Income | `app/income.html` | `app.js`, `transactions.js`, `income.js` | `transactions.php` |
| Expenses | `app/expenses.html` | `app.js`, `transactions.js`, `alerts.js`, `expenses.js` | `transactions.php` |
| History | `app/history.html` | `app.js`, `transactions.js`, `history.js` | `transactions.php` |
| Goals | `app/goals.html` | `app.js`, `goals.js` | `goals.php` |
| Bills | `app/bills.html` | `app.js`, `bills.js` | `bills.php` |
| Settings | `app/settings.html` | `app.js`, `transactions.js`, `settings.js` | `budgets.php` |

---

## 9. Key Design Patterns & Decisions

### PDO Prepared Statements (SQL Injection Prevention)
```php
$stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
$stmt->execute([$email]);
```
All queries use parameterized placeholders — never string concatenation with user input.

### Ownership Checks
Every DELETE / UPDATE includes `AND user_id = ?` to prevent users from modifying other users' data:
```php
DELETE FROM income WHERE id = ? AND user_id = ?
```

### Database Transactions (Atomicity)
`budgets.php` save action and `goals.php` auto-contribution processing use `beginTransaction()` / `commit()` / `rollBack()` to ensure partial writes don't leave corrupt data.

### CSS Design System (`style.css`)
Uses CSS custom properties (variables) as a design token system:
```css
--color-primary: #6C63FF;
--color-success: #10B981;
--color-danger: #EF4444;
--font-body: 'Inter', sans-serif;
```
All components reference these tokens, making theming consistent.

### Event-Driven UI Updates
Instead of each JS file directly calling dashboard functions, they dispatch custom events:
```js
window.dispatchEvent(new Event('transactionsSynced'));
```
`dashboard.js` listens:
```js
window.addEventListener('transactionsSynced', renderDashboard);
```
This decouples data syncing from UI rendering.

---

## 10. Frequently Asked Viva Questions

**Q: How does login work end-to-end?**  
A: User submits form → `auth.js` POSTs to `auth.php?action=login` → PHP fetches user by email → `password_verify()` checks bcrypt hash → on success, sets `$_SESSION['user_id']` and returns user object as JSON → `auth.js` saves `{id, name}` to `localStorage['fundora_user']` → redirects to dashboard.

**Q: Why do you use localStorage AND PHP sessions?**  
A: localStorage makes the UI instant — no wait for a server round-trip to check if user is logged in. PHP sessions are the real security layer — every API call checks `$_SESSION['user_id']`.

**Q: How do budget alerts work?**  
A: `alerts.js` reads budgets from localStorage (synced from DB), calls `expensesByCategoryForPeriod(period)` which filters expenses by today/this week/this month, calculates `spent/limit × 100`, and renders warning (≥80%) or danger (≥100%) alerts.

**Q: What is a NetTransfer in goals?**  
A: When a user contributes to a goal using money "from their hand" — it deducts from `availableNetAmount` (income − expenses − previous transfers). This reflects real money movement. A plain `Deposit` just logs to the goal without affecting the balance calculation.

**Q: How do automatic contributions work?**  
A: Every time `goals.php?action=fetch_all` is called, `processAutomaticContributions()` runs. It finds active goals where `next_auto_contribution_date <= today`, inserts `Automatic` contribution records for all missed dates, and advances `next_auto_contribution_date` to the next month.

**Q: How does recurring bill payment work?**  
A: When `mark_paid` is called, a `bill_payments` record is inserted. If the bill is `One-time`, its status becomes `Paid`. If it's recurring (Monthly, Weekly etc.), `nextBillDueDate()` calculates the next due date and updates the bill's `due_date` and keeps status as `Active`.

**Q: How are charts generated?**  
A: Using Chart.js library (loaded via CDN). `charts.js` reads data from `getIncome()` and `getExpenses()` (localStorage), aggregates it, and creates Chart.js instances on `<canvas>` elements. Charts are destroyed before recreation to prevent memory leaks.

**Q: What prevents SQL injection?**  
A: All SQL queries use PDO prepared statements with `?` placeholders. User input is never concatenated into query strings.

**Q: How does the sidebar load dynamically?**  
A: `initSidebar()` in `app.js` checks if Goals and Bills nav links exist; if not, it creates `<a>` elements and inserts them before the History link. This avoids duplicating nav HTML across all page files.

**Q: What is the `_mutationsInFlight` variable?**  
A: A counter that tracks in-progress write operations (add/delete). `syncTransactions()` checks `if (_mutationsInFlight > 0) return;` to avoid overwriting optimistic localStorage updates with potentially stale data fetched just before the write completed.

---

## 11. Team

| Name | Index |
|---|---|
| T M D P M De Alwis | EC/2022/012 |
| K G H D Bandara | EC/2022/037 |
| T G R Sadeepa | EC/2022/067 |
| P L T Chandunu | EC/2022/058 |
