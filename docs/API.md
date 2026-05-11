# 🔌 Fundora — PHP API Reference

All endpoints are located in the `php/` directory. They return JSON responses.

---

## Base URL

```
http://localhost/fundora/php/
```

---

## Authentication — `auth.php`

### POST — Register

```
POST /php/auth.php?action=register
Content-Type: application/x-www-form-urlencoded

name=John+Doe&email=john@example.com&password=secret123
```

**Response:**
```json
{ "success": true, "message": "Account created successfully" }
```

---

### POST — Login

```
POST /php/auth.php?action=login
Content-Type: application/x-www-form-urlencoded

email=john@example.com&password=secret123
```

**Response:**
```json
{ "success": true, "user": { "id": 1, "name": "John Doe" } }
```

---

### GET — Logout

```
GET /php/auth.php?action=logout
```

**Response:**
```json
{ "success": true }
```

---

## Transactions — `transactions.php`

> ⚠️ All endpoints require an active login session.

### GET — Fetch All Transactions

```
GET /php/transactions.php
```

**Response:**
```json
{
  "income": [
    { "id": 1, "source": "Scholarship", "amount": "15000.00", "date": "2025-01-05", "notes": "" }
  ],
  "expenses": [
    { "id": 2, "category": "Food", "amount": "350.00", "description": "Lunch", "date": "2025-01-06" }
  ]
}
```

---

### POST — Add Income

```
POST /php/transactions.php?type=income
Content-Type: application/x-www-form-urlencoded

source=Scholarship&amount=15000&date=2025-01-05&notes=Monthly+allowance
```

**Response:**
```json
{ "success": true, "id": 5 }
```

---

### POST — Add Expense

```
POST /php/transactions.php?type=expense
Content-Type: application/x-www-form-urlencoded

category=Food&amount=350&description=Lunch&date=2025-01-06
```

**Response:**
```json
{ "success": true, "id": 12 }
```

---

### DELETE — Delete a Transaction

```
DELETE /php/transactions.php?type=income&id=5
```

**Response:**
```json
{ "success": true }
```

---

## Budgets — `budgets.php`

### GET — Fetch All Budget Limits

```
GET /php/budgets.php
```

**Response:**
```json
{
  "budgets": [
    { "category": "Food", "monthly_limit": "5000.00" },
    { "category": "Transport", "monthly_limit": "2000.00" }
  ]
}
```

---

### POST — Set / Update Budget Limit

```
POST /php/budgets.php
Content-Type: application/x-www-form-urlencoded

category=Food&monthly_limit=5000
```

**Response:**
```json
{ "success": true }
```

---

## Error Responses

All endpoints return errors in this format:

```json
{ "success": false, "error": "Description of the error" }
```

| HTTP Status | Meaning |
|---|---|
| 200 | Success |
| 400 | Bad request / missing parameters |
| 401 | Not authenticated |
| 500 | Server or database error |
