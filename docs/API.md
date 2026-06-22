# Fundora API Reference

> **Base URL:** `https://fundora.free.nf/php`  
> All endpoints require an active PHP session (login first).

---

## InfinityFree Bypass (Crucial for cURL/Postman)

InfinityFree uses a security system designed to prevent bot access. If you test these endpoints using `curl` or Postman without the security cookie, you will get:
`curl: (52) Empty reply from server`

### How to Bypass:
1. Open `https://fundora.free.nf` in your browser.
2. Open Developer Tools (F12) -> **Application** (or **Storage**) -> **Cookies**.
3. Copy the value of the **`__test`** cookie.
4. Pass this cookie in all external API requests as a header.

---

## Authentication

### Register
```
POST /auth.php?action=register
Content-Type: application/x-www-form-urlencoded
```
**Body params:**
| Field | Type | Required |
|-------|------|----------|
| name | string | yes |
| email | string | yes |
| password | string | yes |

**curl:**
```bash
curl -X POST "https://fundora.free.nf/php/auth.php?action=register" \
  -H "Cookie: __test=YOUR_TEST_COOKIE" \
  -d "name=John&email=john@example.com&password=secret123"
```
**Response:**
```json
{ "success": true, "message": "Account created successfully" }
```

---

### Login
```
POST /auth.php?action=login
Content-Type: application/x-www-form-urlencoded
```
**Body params:**
| Field | Type | Required |
|-------|------|----------|
| email | string | yes |
| password | string | yes |

**curl** *(save the session cookie to cookies.txt)*:
```bash
curl -c cookies.txt -X POST "https://fundora.free.nf/php/auth.php?action=login" \
  -H "Cookie: __test=YOUR_TEST_COOKIE" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=bossblack@gmail.com&password=testpass"
```
**Response:**
```json
{ "success": true, "user": { "id": 1, "name": "John" } }
```

---

### Logout
```
GET /auth.php?action=logout
```
```bash
curl -b cookies.txt -H "Cookie: __test=YOUR_TEST_COOKIE" \
  "https://fundora.free.nf/php/auth.php?action=logout"
```
**Response:**
```json
{ "success": true }
```

---

## Transactions

### Fetch All (Income + Expenses)
```
GET /transactions.php?action=fetch_all
```
```bash
curl -b cookies.txt -H "Cookie: __test=YOUR_TEST_COOKIE" \
  "https://fundora.free.nf/php/transactions.php?action=fetch_all"
```
**Response:**
```json
{
  "success": true,
  "income": [
    { "id": 1, "user_id": 1, "source": "Salary", "amount": "50000.00", "date": "2025-06-01", "notes": "" }
  ],
  "expenses": [
    { "id": 1, "user_id": 1, "category": "Food", "amount": "1500.00", "description": "Groceries", "date": "2025-06-05" }
  ]
}
```

---

### Add Income
```
POST /transactions.php?action=add_income
Content-Type: application/x-www-form-urlencoded
```
**Body params:**
| Field | Type | Required |
|-------|------|----------|
| source | string | yes |
| amount | number | yes |
| date | YYYY-MM-DD | yes |
| notes | string | no |

```bash
curl -b cookies.txt -H "Cookie: __test=YOUR_TEST_COOKIE" \
  -X POST "https://fundora.free.nf/php/transactions.php?action=add_income" \
  -d "source=Freelance&amount=15000&date=2025-06-10&notes=Web project"
```
**Response:**
```json
{ "success": true, "id": 5 }
```

---

### Add Expense
```
POST /transactions.php?action=add_expense
Content-Type: application/x-www-form-urlencoded
```
**Body params:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| category | string | yes | One of: Food, Transport, Rent, Entertainment, Health, Education, Other |
| amount | number | yes | |
| date | YYYY-MM-DD | yes | |
| description | string | no | |

```bash
curl -b cookies.txt -H "Cookie: __test=YOUR_TEST_COOKIE" \
  -X POST "https://fundora.free.nf/php/transactions.php?action=add_expense" \
  -d "category=Food&amount=850&date=2025-06-12&description=Restaurant"
```
**Response:**
```json
{ "success": true, "id": 12 }
```

---

### Delete Income
```
POST /transactions.php?action=delete_income
Content-Type: application/x-www-form-urlencoded
```
| Field | Type | Required |
|-------|------|----------|
| id | integer | yes |

```bash
curl -b cookies.txt -H "Cookie: __test=YOUR_TEST_COOKIE" \
  -X POST "https://fundora.free.nf/php/transactions.php?action=delete_income" \
  -d "id=5"
```
**Response:**
```json
{ "success": true }
```

---

### Delete Expense
```
POST /transactions.php?action=delete_expense
Content-Type: application/x-www-form-urlencoded
```
```bash
curl -b cookies.txt -H "Cookie: __test=YOUR_TEST_COOKIE" \
  -X POST "https://fundora.free.nf/php/transactions.php?action=delete_expense" \
  -d "id=12"
```
**Response:**
```json
{ "success": true }
```

---

## Budgets

### Fetch All Budgets
```
GET /budgets.php?action=fetch
```
```bash
curl -b cookies.txt -H "Cookie: __test=YOUR_TEST_COOKIE" \
  "https://fundora.free.nf/php/budgets.php?action=fetch"
```
**Response:**
```json
{
  "success": true,
  "budgets": {
    "daily": { "Food": 1000 },
    "weekly": { "Transport": 3000 },
    "monthly": { "Rent": 20000 }
  }
}
```

---

### Save Budgets
```
POST /budgets.php?action=save
Content-Type: application/json
```
```bash
curl -b cookies.txt -H "Cookie: __test=YOUR_TEST_COOKIE" \
  -X POST "https://fundora.free.nf/php/budgets.php?action=save" \
  -H "Content-Type: application/json" \
  -d '{"budgets":{"daily":{"Food":1000},"weekly":{"Transport":3000},"monthly":{"Rent":20000,"Health":3000}}}'
```
**Response:**
```json
{ "success": true }
```

---

## SQL Table for Budgets

```sql
CREATE TABLE IF NOT EXISTS budgets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category ENUM('Food','Transport','Rent','Entertainment','Health','Education','Other') NOT NULL,
    period ENUM('daily','weekly','monthly') NOT NULL DEFAULT 'monthly',
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_category_period (user_id, category, period),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## Goal Contributions

Goal contributions support these user actions:

- `Deposit` — adds savings without changing the user's net amount.
- `NetTransfer` — adds savings and deducts the amount from available net funds.
- `Withdrawal` — reduces the goal's saved amount.

`GET /goals.php?action=fetch_all` also returns `available_net_amount` and
`current_month_goal_cash_movement`. Net transfers reduce cash-in-hand, while
withdrawals return money to it.

---

## Bill Reminders

- `GET /bills.php?action=fetch_all` — bills, alerts, monthly summary, and payment history.
- `POST /bills.php?action=create` — create one-time or recurring bills.
- `POST /bills.php?action=update` — edit bill and reminder settings.
- `POST /bills.php?action=mark_paid` — record payment and advance recurring bills.
- `POST /bills.php?action=delete` — delete a bill and its payment history.
