-- Marketing newsletter subscribers

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id              BIGSERIAL PRIMARY KEY,
    email           VARCHAR(320) NOT NULL,
    source          VARCHAR(80) NOT NULL DEFAULT 'footer',
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    unsubscribe_token VARCHAR(64) NOT NULL,
    account_id      VARCHAR(100) REFERENCES accounts (id) ON DELETE SET NULL,
    subscribed_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    unsubscribed_at TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_newsletter_subscribers_email UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_active
    ON newsletter_subscribers (active, subscribed_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_newsletter_subscribers_token
    ON newsletter_subscribers (unsubscribe_token);
