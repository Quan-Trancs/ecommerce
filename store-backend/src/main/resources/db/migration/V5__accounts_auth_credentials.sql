-- Auth credentials on accounts (single DB: Postgres owns users + catalog + orders)

ALTER TABLE accounts
    ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

ALTER TABLE accounts
    ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE accounts
    ADD COLUMN IF NOT EXISTS image VARCHAR(500);

CREATE UNIQUE INDEX IF NOT EXISTS uq_account_email_lower
    ON accounts (LOWER(email));
