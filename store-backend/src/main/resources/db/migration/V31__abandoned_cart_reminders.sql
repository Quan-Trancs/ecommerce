-- Abandoned cart email reminders

ALTER TABLE carts
    ADD COLUMN IF NOT EXISTS last_abandoned_email_at TIMESTAMP NULL;

ALTER TABLE accounts
    ADD COLUMN IF NOT EXISTS notify_abandoned_cart BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_carts_abandoned_scan
    ON carts (updated_at)
    WHERE last_abandoned_email_at IS NULL
       OR last_abandoned_email_at < updated_at;
