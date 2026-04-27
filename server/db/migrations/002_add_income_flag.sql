-- Add income flag to expenses table so deposits can be tracked separately from expenses
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS is_income BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_expenses_is_income ON expenses(user_id, is_income);
