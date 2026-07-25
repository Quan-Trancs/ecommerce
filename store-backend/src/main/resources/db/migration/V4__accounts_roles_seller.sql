-- Role-based accounts + seller ownership on products

CREATE TABLE IF NOT EXISTS accounts (
    id            VARCHAR(100) PRIMARY KEY,
    email         VARCHAR(255) NOT NULL,
    display_name  VARCHAR(200),
    role          VARCHAR(20)  NOT NULL,
    active        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP    NOT NULL,
    updated_at    TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_account_email ON accounts (email);
CREATE INDEX IF NOT EXISTS idx_account_role ON accounts (role);

CREATE TABLE IF NOT EXISTS seller_profiles (
    account_id  VARCHAR(100) PRIMARY KEY REFERENCES accounts (id) ON DELETE CASCADE,
    shop_name   VARCHAR(200) NOT NULL,
    bio         VARCHAR(500),
    verified    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP    NOT NULL,
    updated_at  TIMESTAMP
);

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS seller_account_id VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_product_seller ON products (seller_account_id);
