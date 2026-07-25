-- Buyer wishlist / saved products

CREATE TABLE IF NOT EXISTS wishlist_items (
    account_id      VARCHAR(100) NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    product_id      VARCHAR(50) NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (account_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_account_created
    ON wishlist_items (account_id, created_at DESC);
