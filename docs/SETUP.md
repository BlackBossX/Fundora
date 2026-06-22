# 🚀 Fundora — Setup Guide

This guide walks you through setting up Fundora on your local machine using XAMPP.

---

## Prerequisites

| Tool | Version | Download |
|---|---|---|
| XAMPP | 8.2+ | [apachefriends.org](https://www.apachefriends.org/) |
| PHP | 8.0+ | Included with XAMPP |
| MySQL | 8.0+ | Included with XAMPP |
| Browser | Any modern | Chrome recommended |

---

## Step 1 — Install XAMPP

1. Download XAMPP from [apachefriends.org](https://www.apachefriends.org/)
2. Install it (default path on Linux: `/opt/lampp/`)
3. Start the **Apache** and **MySQL** modules from the XAMPP Control Panel

---

## Step 2 — Copy Project Files

Copy the entire `Fundora/` folder into your XAMPP web root:

```bash
# Linux
sudo cp -r /path/to/Fundora /opt/lampp/htdocs/fundora

# Windows
# Copy to: C:\xampp\htdocs\fundora
```

---

## Step 3 — Create the Database

1. Open your browser and go to: `http://localhost/phpmyadmin`
2. Click **New** in the left sidebar
3. Name the database: `fundora_db`
4. Click **Create**
5. Click **Import** tab → choose `database/schema/database.sql` → click **Go**

If you already installed an older Fundora database, import
`database/migrations/migrate_budget_periods.sql` once instead. Existing limits will be
kept as monthly limits.

To add Goals & Savings to an existing installation, also import
`database/migrations/migrate_goals_savings.sql` once.

For the “Add from Net Amount” transfer option, import
`database/migrations/migrate_net_goal_contributions.sql` once as well.

To add Bill Payment Reminders, import
`database/migrations/migrate_bill_reminders.sql` once.

---

## Step 4 — Configure Database Connection

Copy `php/db.php.example` to `php/db.php`, then edit `php/db.php` if your
database credentials differ from XAMPP's defaults.

```php
<?php
$host = "localhost";
$dbname = "fundora_db";
$user = "root";
$pass = "";
?>
```

---

## Step 5 — Run the Project

Open your browser and navigate to:

```
http://localhost/fundora
```

You should see the Fundora landing page!

---

## Default Test Credentials

After importing the database, you can log in with:

| Field | Value |
|---|---|
| Email | `test@fundora.lk` |
| Password | `password123` |

---

## Troubleshooting

### Apache won't start
- Port 80 may be in use. Change Apache's port in XAMPP config or stop the conflicting service.

### Database connection error
- Ensure MySQL is running in XAMPP
- Double-check credentials in `php/db.php`
- Verify the `fundora_db` database exists in phpMyAdmin

### Blank page or PHP errors
- Enable error display: add `ini_set('display_errors', 1);` at the top of `php/db.php`
- Check the Apache error log at `/opt/lampp/logs/error_log`

---

## Development Tips

- Use **VS Code** with the **PHP Intelephense** and **Live Server** extensions
- Enable **PHP error reporting** during development
- Use **phpMyAdmin** to inspect your database tables in real time
- Keep browser **DevTools** open to catch JS/CSS errors
