-- Batch email digests for followed-shop announcements

CREATE TABLE IF NOT EXISTS shop_announcement_digest_queue (
    id                    BIGSERIAL PRIMARY KEY,
    follower_account_id   VARCHAR(100) NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    seller_account_id     VARCHAR(100) NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    announcement_id       BIGINT NOT NULL REFERENCES shop_announcements (id) ON DELETE CASCADE,
    created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_shop_announcement_digest_follower_announcement
        UNIQUE (follower_account_id, announcement_id)
);

CREATE INDEX IF NOT EXISTS idx_shop_announcement_digest_follower
    ON shop_announcement_digest_queue (follower_account_id, created_at ASC);
