-- Seller payouts ledger (earnings settlement)

CREATE TABLE IF NOT EXISTS seller_payouts (
    id                  BIGSERIAL PRIMARY KEY,
    seller_account_id   VARCHAR(100) NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    amount              NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    currency            VARCHAR(3) NOT NULL DEFAULT 'USD',
    note                TEXT,
    recorded_by         VARCHAR(100) REFERENCES accounts (id) ON DELETE SET NULL,
    paid_at             TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seller_payouts_seller_paid
    ON seller_payouts (seller_account_id, paid_at DESC);
