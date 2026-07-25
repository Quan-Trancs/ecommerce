-- Gift cards (store credit codes applied at checkout)

CREATE TABLE IF NOT EXISTS gift_cards (
    id                  BIGSERIAL PRIMARY KEY,
    code                VARCHAR(40) NOT NULL,
    initial_balance     NUMERIC(12, 2) NOT NULL CHECK (initial_balance > 0),
    remaining_balance   NUMERIC(12, 2) NOT NULL CHECK (remaining_balance >= 0),
    currency            VARCHAR(3) NOT NULL DEFAULT 'USD',
    active              BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at          TIMESTAMP,
    created_by          VARCHAR(100) REFERENCES accounts (id) ON DELETE SET NULL,
    note                VARCHAR(500),
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_gift_cards_code UNIQUE (code)
);

CREATE INDEX IF NOT EXISTS idx_gift_cards_active
    ON gift_cards (active, remaining_balance);

CREATE TABLE IF NOT EXISTS gift_card_redemptions (
    id              BIGSERIAL PRIMARY KEY,
    gift_card_id    BIGINT NOT NULL REFERENCES gift_cards (id) ON DELETE CASCADE,
    order_id        VARCHAR(36) NOT NULL,
    account_id      VARCHAR(100) NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    amount          NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_gift_card_redemptions_order UNIQUE (order_id)
);

CREATE INDEX IF NOT EXISTS idx_gift_card_redemptions_card
    ON gift_card_redemptions (gift_card_id);

INSERT INTO gift_cards (code, initial_balance, remaining_balance, currency, active, note)
VALUES ('GIFT25', 25.00, 25.00, 'USD', TRUE, 'Demo gift card')
ON CONFLICT (code) DO NOTHING;
