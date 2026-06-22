USE fundora_db;

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
