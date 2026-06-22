# 💰 Fundora — Smart Student Finance & Budget Tracker

<p align="center">
  <img src="assets/icons/white_logo.png" alt="Fundora Logo" width="180"/>
</p>

<p align="center">
  <strong>A centralized web-based personal finance platform built for university students.</strong><br/>
  Track income, log expenses, set budget alerts, and visualize your spending — all in one place.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-In%20Development-yellow?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Frontend-HTML%20%7C%20CSS%20%7C%20JS-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Backend-PHP-purple?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Database-MySQL-orange?style=for-the-badge" />
</p>

---

## 📖 Table of Contents

- [About the Project](#about-the-project)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Pages Overview](#pages-overview)
- [Team](#team)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 About the Project

Many university students struggle with managing their limited monthly budgets across scattered apps, notes, and spreadsheets. **Fundora** solves this by centralizing all financial monitoring into a single, student-friendly platform.

Whether you receive an allowance, a scholarship, or part-time income — Fundora gives you the tools to:
- Stay on top of your spending
- Build responsible money habits
- Reduce financial stress
- Make informed financial decisions throughout your academic journey

---

## ✨ Features

| Feature | Description |
|---|---|
| 📥 **Income Tracking** | Log multiple income sources (allowances, scholarships, part-time pay) with dates and notes |
| 💸 **Expense Logging** | Record daily expenses by category: Food, Transport, Rent, Entertainment |
| 🔔 **Budget Alerts** | Set daily, weekly, and monthly limits per category and receive real-time warnings when approaching or exceeding them |
| 🎯 **Goals & Savings** | Create savings targets, record deposits and withdrawals, schedule monthly contributions, and analyze progress |
| 🧾 **Bill Reminders** | Track recurring bills, configure multiple reminders, record payments, and monitor overdue accounts |
| 📊 **Visual Reports** | Interactive pie and bar charts displaying spending breakdowns |
| 🔍 **History & Filters** | Browse full transaction history filtered by date, category, or amount |
| 📱 **Responsive UI** | Mobile-friendly interface that works seamlessly on phones, tablets, and desktops |

---

## 🛠️ Tech Stack

### Frontend
- **HTML5** — Semantic, accessible markup
- **CSS3** — Custom properties, Flexbox, Grid, animations
- **JavaScript** — Chart.js for visualizations, vanilla JS for interactivity

### Backend
- **PHP** — Server-side logic and API endpoints

### Database
- **MySQL** — Relational database for user data, transactions, and budget settings

---

## 📁 Project Structure

```
Fundora/
├── index.html
├── login.html
├── register.html
│
├── app/
│   ├── dashboard.html
│   ├── income.html
│   ├── expenses.html
│   ├── history.html
│   ├── settings.html
│   ├── goals.html
│   └── bills.html
│
├── assets/
│   ├── css/
│   ├── js/
│   └── icons/
│
├── php/
│   ├── db.php.example
│   ├── auth.php
│   ├── transactions.php
│   ├── budgets.php
│   ├── goals.php
│   └── bills.php
│
├── database/
│   ├── schema/
│   │   └── database.sql
│   └── migrations/
│
├── docs/
│   ├── SETUP.md
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── DATABASE.md
│   └── Fundora_Proposal.pdf
│
└── .github/
```

---

## 🚀 Getting Started

See [docs/SETUP.md](docs/SETUP.md) for the full setup guide. Quick start:

### Prerequisites
- **XAMPP** (or any LAMP/WAMP stack) with PHP 8.0+ and MySQL 8.0+
- A modern web browser (Chrome, Firefox, Edge)
- *(Optional)* VS Code with the PHP Intelephense extension

### Quick Setup

```bash
# 1. Clone or copy the project into your XAMPP htdocs folder
cp -r Fundora/ /opt/lampp/htdocs/fundora

# 2. Start Apache and MySQL via XAMPP control panel

# 3. Import the database
# Open http://localhost/phpmyadmin
# Create a database named 'fundora_db'
# Import: database/schema/database.sql

# 4. Configure the database connection
# Copy php/db.php.example to php/db.php and edit if needed

# 5. Open the project
# Navigate to: http://localhost/fundora
```

---

## 📄 Pages Overview

| Page | File | Description |
|---|---|---|
| 🏠 Landing | `index.html` | Hero, features overview, CTA to sign up |
| 🔐 Login | `login.html` | User sign in |
| 📝 Register | `register.html` | Create a new account |
| 📊 Dashboard | `app/dashboard.html` | Summary cards, charts, recent transactions |
| 📥 Income | `app/income.html` | Add/edit income entries |
| 💸 Expenses | `app/expenses.html` | Add/edit expense entries by category |
| 🎯 Goals | `app/goals.html` | Savings goals and contributions |
| 🧾 Bills | `app/bills.html` | Bill reminders and payments |
| 🔍 History | `app/history.html` | Searchable, filterable transaction log |
| ⚙️ Settings | `app/settings.html` | Set budget limits, manage profile |

---

## 👥 Team

| Name | ID |
|---|---|
| T M D P M De Alwis | EC/2022/012 |
| K G H D Bandara | EC/2022/037 |
| T G R Sadeepa | EC/2022/067 |
| P L T Chandunu | EC/2022/058 |

> **Course:** COSC 31103 / BECS 31233 — Web Technologies  
> **Institution:** University of Kelaniya, Electronics and Computer Science

---

## 🤝 Contributing

This is an academic project. For any suggestions or improvements, please open an issue or contact a team member.

---

## 📜 License

This project is for academic use. All rights reserved by the team members listed above.
