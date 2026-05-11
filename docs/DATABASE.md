# 🗄️ Fundora — Database Schema

This document describes the MySQL database structure used by Fundora.

---

## Database Name: `fundora_db`

---

## Tables Overview

```
fundora_db
├── users           — Registered accounts
├── income          — Income entries per user
├── expenses        — Expense entries per user
└── budgets         — Monthly budget limits per category
```

---

## Table: `users`

Stores user account information.

```sql
CREATE TABLE users (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(150) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,         -- bcrypt hashed
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

| Column | Type | Description |
|---|---|---|
| `id` | INT | Auto-incremented primary key |
| `name` | VARCHAR(100) | User's display name |
| `email` | VARCHAR(150) | Unique login email |
| `password` | VARCHAR(255) | bcrypt hashed password |
| `created_at` | TIMESTAMP | Account creation time |

---

## Table: `income`

Stores all income entries logged by users.

```sql
CREATE TABLE income (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    source      VARCHAR(100) NOT NULL,        -- e.g., "Scholarship", "Part-time"
    amount      DECIMAL(10, 2) NOT NULL,
    date        DATE NOT NULL,
    notes       TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

| Column | Type | Description |
|---|---|---|
| `id` | INT | Primary key |
| `user_id` | INT | FK → users.id |
| `source` | VARCHAR(100) | Income source label |
| `amount` | DECIMAL(10,2) | Amount in LKR |
| `date` | DATE | Date of income |
| `notes` | TEXT | Optional description |

---

## Table: `expenses`

Stores all expense entries logged by users.

```sql
CREATE TABLE expenses (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    category    ENUM('Food', 'Transport', 'Rent', 'Entertainment', 'Health', 'Education', 'Other') NOT NULL,
    amount      DECIMAL(10, 2) NOT NULL,
    description VARCHAR(255),
    date        DATE NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

| Column | Type | Description |
|---|---|---|
| `id` | INT | Primary key |
| `user_id` | INT | FK → users.id |
| `category` | ENUM | Expense category |
| `amount` | DECIMAL(10,2) | Amount in LKR |
| `description` | VARCHAR(255) | Optional label |
| `date` | DATE | Date of expense |

---

## Table: `budgets`

Stores monthly budget limits per expense category per user.

```sql
CREATE TABLE budgets (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    category    ENUM('Food', 'Transport', 'Rent', 'Entertainment', 'Health', 'Education', 'Other') NOT NULL,
    monthly_limit DECIMAL(10, 2) NOT NULL,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_budget (user_id, category)
);
```

| Column | Type | Description |
|---|---|---|
| `id` | INT | Primary key |
| `user_id` | INT | FK → users.id |
| `category` | ENUM | Budget category |
| `monthly_limit` | DECIMAL(10,2) | Spending cap in LKR |
| `updated_at` | TIMESTAMP | Last update timestamp |

---

## Entity-Relationship Diagram

```
users
  │
  ├──< income    (one user → many income entries)
  ├──< expenses  (one user → many expense entries)
  └──< budgets   (one user → many budget limits)
```

---

## Full SQL Dump (for import)

Save this as `php/fundora_db.sql` and import it via phpMyAdmin:

```sql
-- Create and use database
CREATE DATABASE IF NOT EXISTS fundora_db;
USE fundora_db;

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Income table
CREATE TABLE income (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    source VARCHAR(100) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Expenses table
CREATE TABLE expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category ENUM('Food','Transport','Rent','Entertainment','Health','Education','Other') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description VARCHAR(255),
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Budgets table
CREATE TABLE budgets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category ENUM('Food','Transport','Rent','Entertainment','Health','Education','Other') NOT NULL,
    monthly_limit DECIMAL(10, 2) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_budget (user_id, category)
);

-- Test user (password: password123)
INSERT INTO users (name, email, password) VALUES
('Test User', 'test@fundora.lk', '$2y$10$XtNfTuEnYXJQFa9DLFKF5eQB./Rr8.GBJFcjZMOZf5o4KpH3.t7G');
```
