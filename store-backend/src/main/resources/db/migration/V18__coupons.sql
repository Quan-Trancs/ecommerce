-- Checkout promo codes / coupons

CREATE TABLE IF NOT EXISTS coupons (
    id                BIGSERIAL PRIMARY KEY,
    code              VARCHAR(40) NOT NULL,
    discount_type     VARCHAR(20) NOT NULL CHECK (discount_type IN ('PERCENT', 'FIXED')),
    discount_value    NUMERIC(12, 2) NOT NULL CHECK (discount_value > 0),
    min_subtotal      NUMERIC(12, 2) NOT NULL DEFAULT 0,
    max_redemptions   INTEGER,
    per_user_limit    INTEGER NOT NULL DEFAULT 1,
    starts_at         TIMESTAMP,
    ends_at           TIMESTAMP,
    active            BOOLEAN NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_coupons_code UNIQUE (code)
);

CREATE TABLE IF NOT EXISTS coupon_redemptions (
    id            BIGSERIAL PRIMARY KEY,
    coupon_id     BIGINT NOT NULL REFERENCES coupons (id) ON DELETE CASCADE,
    account_id    VARCHAR(100) NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    order_id      VARCHAR(36) NOT NULL,
    discount_amount NUMERIC(12, 2) NOT NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_coupon_redemptions_order UNIQUE (order_id)
);

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon
    ON coupon_redemptions (coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_account
    ON coupon_redemptions (account_id);

INSERT INTO coupons (code, discount_type, discount_value, min_subtotal, max_redemptions, per_user_limit, active)
VALUES ('WELCOME10', 'PERCENT', 10, 0, NULL, 1, TRUE)
ON CONFLICT (code) DO NOTHING;
