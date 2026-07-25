-- Per-account preference: email when a public order note is posted

ALTER TABLE accounts
    ADD COLUMN IF NOT EXISTS notify_order_notes BOOLEAN NOT NULL DEFAULT TRUE;
