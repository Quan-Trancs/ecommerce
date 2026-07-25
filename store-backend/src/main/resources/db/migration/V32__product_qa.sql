-- Product Q&A (one seller/admin answer per question)

CREATE TABLE IF NOT EXISTS product_questions (
    id                 BIGSERIAL PRIMARY KEY,
    product_id         VARCHAR(50) NOT NULL,
    asker_account_id   VARCHAR(100) NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    body               TEXT NOT NULL,
    answer_body        TEXT,
    answer_account_id  VARCHAR(100) REFERENCES accounts (id) ON DELETE SET NULL,
    answered_at        TIMESTAMP,
    created_at         TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_questions_product_created
    ON product_questions (product_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_product_questions_asker
    ON product_questions (asker_account_id);
