-- Urgent flag on order notes + SMS/push notification prefs

ALTER TABLE store_order_notes
    ADD COLUMN IF NOT EXISTS urgent BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE accounts
    ADD COLUMN IF NOT EXISTS phone_e164 VARCHAR(20);

ALTER TABLE accounts
    ADD COLUMN IF NOT EXISTS notify_order_notes_sms BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE accounts
    ADD COLUMN IF NOT EXISTS notify_order_notes_push BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id              BIGSERIAL PRIMARY KEY,
    account_id      VARCHAR(100) NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    endpoint        TEXT NOT NULL,
    p256dh          TEXT NOT NULL,
    auth            TEXT NOT NULL,
    user_agent      VARCHAR(500),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_push_subscription_endpoint UNIQUE (endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_sub_account ON push_subscriptions (account_id);
