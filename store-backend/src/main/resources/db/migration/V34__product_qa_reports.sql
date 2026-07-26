-- Buyer reports for abusive / off-topic product Q&A

CREATE TABLE IF NOT EXISTS product_question_reports (
    id                    BIGSERIAL PRIMARY KEY,
    question_id           BIGINT NOT NULL REFERENCES product_questions (id) ON DELETE CASCADE,
    reporter_account_id   VARCHAR(100) NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    reason                VARCHAR(40) NOT NULL DEFAULT 'OTHER',
    note                  TEXT,
    status                VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
    resolved_at           TIMESTAMP,
    resolved_by_account_id VARCHAR(100) REFERENCES accounts (id) ON DELETE SET NULL,
    CONSTRAINT uq_product_question_reports_question_reporter
        UNIQUE (question_id, reporter_account_id),
    CONSTRAINT chk_product_question_reports_status
        CHECK (status IN ('OPEN', 'DISMISSED', 'RESOLVED')),
    CONSTRAINT chk_product_question_reports_reason
        CHECK (reason IN ('SPAM', 'OFFENSIVE', 'MISLEADING', 'OTHER'))
);

CREATE INDEX IF NOT EXISTS idx_product_question_reports_open
    ON product_question_reports (status, created_at ASC)
    WHERE status = 'OPEN';
