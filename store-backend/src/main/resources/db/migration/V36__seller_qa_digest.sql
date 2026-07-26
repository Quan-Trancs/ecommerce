-- Seller unanswered product Q&A email digests

ALTER TABLE accounts
    ADD COLUMN IF NOT EXISTS notify_qa_digest BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS seller_qa_digest_state (
    seller_account_id VARCHAR(100) PRIMARY KEY REFERENCES accounts (id) ON DELETE CASCADE,
    last_sent_at      TIMESTAMP NOT NULL
);
