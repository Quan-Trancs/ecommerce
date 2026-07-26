-- Seller announcements posted to shop followers (in-app)

CREATE TABLE IF NOT EXISTS shop_announcements (
    id                  BIGSERIAL PRIMARY KEY,
    seller_account_id   VARCHAR(100) NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    title               VARCHAR(120) NOT NULL,
    body                VARCHAR(500) NOT NULL,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shop_announcements_seller_created
    ON shop_announcements (seller_account_id, created_at DESC);
