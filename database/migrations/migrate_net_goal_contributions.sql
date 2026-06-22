USE fundora_db;

ALTER TABLE goal_contributions
    MODIFY COLUMN type ENUM('Deposit','NetTransfer','Withdrawal','Automatic')
    NOT NULL DEFAULT 'Deposit';
