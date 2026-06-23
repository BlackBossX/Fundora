CREATE DATABASE IF NOT EXISTS fundora_db;
USE fundora_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS income (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    source VARCHAR(100) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category ENUM('Food', 'Transport', 'Rent', 'Entertainment', 'Health', 'Education', 'Other') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description VARCHAR(255),
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS budgets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category ENUM('Food', 'Transport', 'Rent', 'Entertainment', 'Health', 'Education', 'Other') NOT NULL,
    period ENUM('daily', 'weekly', 'monthly') NOT NULL DEFAULT 'monthly',
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_category_period (user_id, category, period),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS savings_goals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(120) NOT NULL,
    category ENUM('Emergency','Education','Travel','Technology','Vehicle','Home','Investment','Other') NOT NULL DEFAULT 'Other',
    target_amount DECIMAL(12, 2) NOT NULL,
    target_date DATE NOT NULL,
    priority ENUM('High','Medium','Low') NOT NULL DEFAULT 'Medium',
    description TEXT,
    status ENUM('Active','Completed','Paused','Cancelled') NOT NULL DEFAULT 'Active',
    auto_contribution_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    auto_contribution_day TINYINT UNSIGNED NOT NULL DEFAULT 1,
    next_auto_contribution_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS goal_contributions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    goal_id INT NOT NULL,
    user_id INT NOT NULL,
    type ENUM('Deposit','NetTransfer','Withdrawal','Automatic') NOT NULL DEFAULT 'Deposit',
    amount DECIMAL(12, 2) NOT NULL,
    contribution_date DATE NOT NULL,
    notes VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (goal_id) REFERENCES savings_goals(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_goal_contributions_goal_date (goal_id, contribution_date)
);

CREATE TABLE IF NOT EXISTS bills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(120) NOT NULL,
    category ENUM('Utilities','Housing','Internet','Loan','Insurance','Education','Subscription','Other') NOT NULL DEFAULT 'Other',
    amount_due DECIMAL(12,2) NOT NULL,
    due_date DATE NOT NULL,
    provider VARCHAR(150),
    notes TEXT,
    recurrence ENUM('One-time','Weekly','Monthly','Quarterly','Yearly','Custom') NOT NULL DEFAULT 'One-time',
    custom_interval_days INT UNSIGNED NULL,
    reminder_offsets VARCHAR(100) NOT NULL DEFAULT '0',
    custom_reminder_dates TEXT,
    status ENUM('Active','Paid','Cancelled') NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_bills_user_due (user_id, due_date)
);

CREATE TABLE IF NOT EXISTS bill_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bill_id INT NOT NULL,
    user_id INT NOT NULL,
    amount_paid DECIMAL(12,2) NOT NULL,
    payment_date DATE NOT NULL,
    due_date_paid DATE NOT NULL,
    notes VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_bill_payments_user_date (user_id, payment_date)
);
