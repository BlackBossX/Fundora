USE fundora_db;

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
