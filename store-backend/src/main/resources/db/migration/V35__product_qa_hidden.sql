-- Soft-hide product Q&A (e.g. auto-hide after enough open reports)

ALTER TABLE product_questions
    ADD COLUMN IF NOT EXISTS hidden_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS hidden_reason VARCHAR(40);

CREATE INDEX IF NOT EXISTS idx_product_questions_product_visible
    ON product_questions (product_id, created_at DESC)
    WHERE hidden_at IS NULL;
