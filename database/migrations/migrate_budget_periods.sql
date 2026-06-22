USE fundora_db;

-- Existing budget rows remain monthly after this migration.
ALTER TABLE budgets
    ADD COLUMN period ENUM('daily', 'weekly', 'monthly')
    NOT NULL DEFAULT 'monthly' AFTER category;

ALTER TABLE budgets
    DROP INDEX unique_user_category,
    ADD UNIQUE KEY unique_user_category_period (user_id, category, period);
