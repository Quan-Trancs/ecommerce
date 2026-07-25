-- Per-account delivery mode for order-note emails: DIGEST (default) or IMMEDIATE

ALTER TABLE accounts
    ADD COLUMN IF NOT EXISTS order_note_email_mode VARCHAR(20) NOT NULL DEFAULT 'DIGEST';
