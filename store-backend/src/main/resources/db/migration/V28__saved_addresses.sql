-- Saved shipping addresses per account

CREATE TABLE IF NOT EXISTS saved_addresses (
    id              BIGSERIAL PRIMARY KEY,
    account_id      VARCHAR(100) NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    label           VARCHAR(80),
    full_name       VARCHAR(200) NOT NULL,
    street          VARCHAR(500) NOT NULL,
    city            VARCHAR(100) NOT NULL,
    province        VARCHAR(100) NOT NULL,
    postal_code     VARCHAR(30) NOT NULL,
    country         VARCHAR(100) NOT NULL,
    phone           VARCHAR(50) NOT NULL,
    is_default      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_addresses_account
    ON saved_addresses (account_id, is_default DESC, updated_at DESC);
