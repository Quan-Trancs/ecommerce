-- Helpful votes on answered product Q&A

CREATE TABLE IF NOT EXISTS product_question_helpful (
    question_id  BIGINT NOT NULL REFERENCES product_questions (id) ON DELETE CASCADE,
    account_id   VARCHAR(100) NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (question_id, account_id)
);

CREATE INDEX IF NOT EXISTS idx_product_question_helpful_account
    ON product_question_helpful (account_id);
