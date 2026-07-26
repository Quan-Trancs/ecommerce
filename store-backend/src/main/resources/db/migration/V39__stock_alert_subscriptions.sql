-- Buyer back-in-stock (notify me) subscriptions

ALTER TABLE accounts
    ADD COLUMN IF NOT EXISTS notify_back_in_stock BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN accounts.notify_back_in_stock IS
    'When true, email + in-app when a subscribed out-of-stock product returns.';

CREATE TABLE IF NOT EXISTS stock_alert_subscriptions (
    account_id  VARCHAR(100) NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    product_id  VARCHAR(50) NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (account_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_stock_alert_product
    ON stock_alert_subscriptions (product_id);
