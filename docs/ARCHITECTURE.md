# 🏗️ Fundora — System Architecture

This document describes the overall architecture of the Fundora web application.

---

## Architecture Overview

Fundora follows a classic **3-Tier Web Architecture**:

```
┌─────────────────────────────────────────────────────┐
│                  CLIENT (Browser)                   │
│  HTML + CSS + JavaScript + Chart.js                 │
│  Landing / Dashboard / Income / Expenses / History  │
└────────────────────┬────────────────────────────────┘
                     │  HTTP Requests (fetch / form POST)
                     ▼
┌─────────────────────────────────────────────────────┐
│              APPLICATION SERVER (XAMPP)             │
│  Apache + PHP 8.0                                   │
│  Auth / Transactions / Budgets API endpoints        │
└────────────────────┬────────────────────────────────┘
                     │  SQL Queries (PDO)
                     ▼
┌─────────────────────────────────────────────────────┐
│                 DATABASE (MySQL)                    │
│  fundora_db: users, income, expenses, budgets       │
└─────────────────────────────────────────────────────┘
```

---

## Frontend Architecture

### Pages & Responsibilities

| Page | Purpose |
|---|---|
| `index.html` | Public landing page — hero, features, CTA |
| `login.html` | User login |
| `register.html` | User registration |
| `app/dashboard.html` | Authenticated home — charts, summaries, alerts |
| `app/income.html` | Add/manage income entries |
| `app/expenses.html` | Add/manage expense entries |
| `app/history.html` | View/filter all transactions |
| `app/settings.html` | Set budget limits, update profile |
| `app/goals.html` | Savings goals and contributions |
| `app/bills.html` | Bill reminders and payments |

### JavaScript Modules

| File | Responsibility |
|---|---|
| `assets/js/app.js` | Session checks, navigation, shared utilities |
| `assets/js/charts.js` | Chart.js pie/bar chart rendering |
| `assets/js/transactions.js` | CRUD calls to PHP API via `fetch()` |
| `assets/js/alerts.js` | Compare spending vs. budgets, show warnings |

### CSS Architecture

| File | Scope |
|---|---|
| `assets/css/style.css` | Design tokens, reset, typography, layout |
| `assets/css/dashboard.css` | App shell, grid, and chart styles |
| `assets/css/*.css` | Page-specific styles (landing, auth, settings, goals, bills) |

---

## Backend Architecture

### PHP Endpoints

All PHP files follow a simple **REST-like pattern**: they accept `GET` or `POST` requests and return JSON.

```
/php/
├── db.php              — DB connection (PDO)
├── auth.php            — POST /login, POST /register, GET /logout
├── transactions.php    — GET/POST/DELETE for income & expenses
└── budgets.php         — GET/POST budget limits
```

### Authentication

- Sessions managed via PHP `$_SESSION`
- Passwords hashed with `password_hash()` (bcrypt)
- Each protected PHP endpoint checks `$_SESSION['user_id']`

---

## Data Flow — Adding an Expense

```
User fills expense form
      │
      ▼
assets/js/transactions.js sends POST fetch()
      │
      ▼
php/transactions.php validates input
      │
      ├─ Saves to expenses table (MySQL)
      │
      └─ Returns JSON { success: true, id: ... }
            │
            ▼
      js updates the UI table
      assets/js/alerts.js rechecks budget limits
      assets/js/charts.js refreshes charts
```

---

## Security Considerations

| Risk | Mitigation |
|---|---|
| SQL Injection | PDO prepared statements throughout |
| XSS | `htmlspecialchars()` on all output |
| CSRF | Session tokens on POST forms |
| Insecure Passwords | `password_hash()` / `password_verify()` |
| Unauthorized Access | Session check at top of every PHP file |

---

## Scalability Notes

For this academic project, everything runs on a single XAMPP instance. In a production setting, consider:

- Separating the PHP API into a dedicated REST API (Laravel or Slim)
- Using environment variables (`.env`) instead of hardcoded `db.php`
- Hosting on AWS (EC2 + RDS) or DigitalOcean
- Adding HTTPS via Let's Encrypt
- Caching with Redis for repeated chart queries
