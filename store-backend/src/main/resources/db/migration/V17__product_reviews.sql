-- Product reviews (verified paid buyers)

CREATE TABLE IF NOT EXISTS product_reviews (
    id           BIGSERIAL PRIMARY KEY,
    product_id   VARCHAR(50) NOT NULL,
    account_id   VARCHAR(100) NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    order_id     VARCHAR(36),
    rating       SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title        VARCHAR(200),
    body         TEXT NOT NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_product_reviews_account_product UNIQUE (account_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product_created
    ON product_reviews (product_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_product_reviews_account
    ON product_reviews (account_id);
