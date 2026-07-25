-- Low-stock alerts for sellers

ALTER TABLE accounts
    ADD COLUMN IF NOT EXISTS notify_low_stock BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE accounts
    ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER NOT NULL DEFAULT 5;

COMMENT ON COLUMN accounts.notify_low_stock IS
    'When true, create in-app alerts when owned products fall to/below threshold.';
COMMENT ON COLUMN accounts.low_stock_threshold IS
    'Stock level at or below which low-stock alerts fire (default 5).';

CREATE TABLE IF NOT EXISTS low_stock_alert_state (
    product_id          VARCHAR(50) PRIMARY KEY,
    seller_account_id   VARCHAR(100) NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    last_alerted_stock  INTEGER NOT NULL,
    last_alerted_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_low_stock_alert_seller
    ON low_stock_alert_state (seller_account_id);
