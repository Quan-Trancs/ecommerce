-- Post-delivery product review request emails

ALTER TABLE accounts
    ADD COLUMN IF NOT EXISTS notify_review_requests BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN accounts.notify_review_requests IS
    'When true, email asking for product reviews after an order has shipped.';

CREATE TABLE IF NOT EXISTS order_review_request_emails (
    order_id  VARCHAR(36) PRIMARY KEY REFERENCES store_orders (id) ON DELETE CASCADE,
    sent_at   TIMESTAMP NOT NULL DEFAULT NOW()
);
