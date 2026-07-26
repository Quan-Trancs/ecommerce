-- Pin important unanswered product Q&A in seller/staff inboxes

ALTER TABLE product_questions
    ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_product_questions_pinned_open
    ON product_questions (pinned_at DESC NULLS LAST, created_at ASC)
    WHERE answer_body IS NULL AND hidden_at IS NULL;
