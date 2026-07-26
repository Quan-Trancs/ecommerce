-- Buyer follow seller shops + new listing alerts

ALTER TABLE accounts
    ADD COLUMN IF NOT EXISTS notify_shop_follows BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN accounts.notify_shop_follows IS
    'When true, email + in-app when a followed shop publishes a new product.';

CREATE TABLE IF NOT EXISTS shop_follows (
    account_id         VARCHAR(100) NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    seller_account_id  VARCHAR(100) NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    created_at         TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (account_id, seller_account_id),
    CONSTRAINT chk_shop_follows_not_self CHECK (account_id <> seller_account_id)
);

CREATE INDEX IF NOT EXISTS idx_shop_follows_seller
    ON shop_follows (seller_account_id, created_at DESC);
