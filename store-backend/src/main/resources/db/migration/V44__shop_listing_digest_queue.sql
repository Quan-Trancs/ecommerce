-- Batch email digests for followed-shop new listings

CREATE TABLE IF NOT EXISTS shop_listing_digest_queue (
    id                    BIGSERIAL PRIMARY KEY,
    follower_account_id   VARCHAR(100) NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    seller_account_id     VARCHAR(100) NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    product_id            VARCHAR(50) NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_shop_listing_digest_follower_product
        UNIQUE (follower_account_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_shop_listing_digest_follower
    ON shop_listing_digest_queue (follower_account_id, created_at ASC);
