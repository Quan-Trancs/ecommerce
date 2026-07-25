-- Queue public order-note emails for batched digests

CREATE TABLE IF NOT EXISTS order_note_email_queue (
    id                  BIGSERIAL PRIMARY KEY,
    recipient_email     VARCHAR(255) NOT NULL,
    order_id            VARCHAR(36) NOT NULL,
    author_label        VARCHAR(200) NOT NULL,
    author_role_label   VARCHAR(50) NOT NULL,
    body                TEXT NOT NULL,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    sent_at             TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_note_email_queue_pending
    ON order_note_email_queue (recipient_email, created_at)
    WHERE sent_at IS NULL;
