-- In-app notification mute preferences (global + per-order)

ALTER TABLE accounts
    ADD COLUMN IF NOT EXISTS notify_in_app_order_notes BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN accounts.notify_in_app_order_notes IS
    'When false, skip in-app inbox rows for public order notes (email/SMS/push unchanged).';

CREATE TABLE IF NOT EXISTS order_in_app_mutes (
    account_id  VARCHAR(100) NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    order_id    VARCHAR(36) NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (account_id, order_id)
);

CREATE INDEX IF NOT EXISTS idx_order_in_app_mutes_order
    ON order_in_app_mutes (order_id);
