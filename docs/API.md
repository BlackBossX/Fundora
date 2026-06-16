# Fundora API Reference

> **Base URL:** `https://<your-domain>/php`  
> All endpoints require an active PHP session (login first). Replace `<your-domain>` with your InfinityFree domain (e.g. `myfundora.rf.gd`).

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
curl -X POST "https://<your-domain>/php/auth.php?action=register" \
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

**curl** *(save the session cookie!)*:
```bash
curl -c cookies.txt -X POST "https://<your-domain>/php/auth.php?action=login" \
  -d "email=john@example.com&password=secret123"
```
**Response:**
```json
{ "success": true, "user": { "id": 1, "name": "John" } }
```

> **Important:** Save `cookies.txt`. All subsequent requests need `-b cookies.txt` to send the session cookie.

---

### Logout
```
GET /auth.php?action=logout
```
```bash
curl -b cookies.txt "https://<your-domain>/php/auth.php?action=logout"
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
curl -b cookies.txt "https://<your-domain>/php/transactions.php?action=fetch_all"
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
curl -b cookies.txt -X POST "https://<your-domain>/php/transactions.php?action=add_income" \
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
curl -b cookies.txt -X POST "https://<your-domain>/php/transactions.php?action=add_expense" \
  -d "category=Food&amount=850&date=2025-06-12&description=Restaurant dinner"
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
curl -b cookies.txt -X POST "https://<your-domain>/php/transactions.php?action=delete_income" \
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
curl -b cookies.txt -X POST "https://<your-domain>/php/transactions.php?action=delete_expense" \
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
curl -b cookies.txt "https://<your-domain>/php/budgets.php?action=fetch"
```
**Response:**
```json
{
  "success": true,
  "budgets": {
    "Food": 5000,
    "Transport": 2000,
    "Rent": 20000
  }
}
```

---

### Save Budgets
```
POST /budgets.php?action=save
Content-Type: application/json
```
Body: a `budgets` JSON object mapping category to monthly limit in Rs.

```bash
curl -b cookies.txt -X POST "https://<your-domain>/php/budgets.php?action=save" \
  -H "Content-Type: application/json" \
  -d '{"budgets":{"Food":5000,"Transport":2000,"Rent":20000,"Health":3000}}'
```
**Response:**
```json
{ "success": true }
```

> Uses `INSERT ... ON DUPLICATE KEY UPDATE` so it is safe to call repeatedly.

---

## Error Responses

All endpoints return the same error shape:
```json
{ "success": false, "message": "Reason for failure" }
```

| Scenario | message |
|----------|---------|
| Not logged in | Unauthorized |
| Unknown action | Invalid action or method |
| Add failure | Failed to add income / Failed to add expense |
| Delete failure | Failed to delete income / Failed to delete expense |
| DB connection error | Database Connection Failed: ... |

---

## Postman Quick Setup

1. Create a Collection called `Fundora`.
2. Set Collection Variable: `base_url = https://<your-domain>/php`
3. Postman stores cookies automatically — just run **Login** first.
4. Use `{{base_url}}/auth.php?action=login` etc. for each request.

---

## SQL: budgets table

Run this in phpMyAdmin or InfinityFree MySQL panel if tables already exist:

```sql
CREATE TABLE IF NOT EXISTS budgets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category ENUM('Food','Transport','Rent','Entertainment','Health','Education','Other') NOT NULL,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_category (user_id, category),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```
