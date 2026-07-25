-- Buyer return / RMA requests (staff review; refund still via existing tools)

CREATE TABLE IF NOT EXISTS order_return_requests (
    id              BIGSERIAL PRIMARY KEY,
    order_id        VARCHAR(100) NOT NULL REFERENCES store_orders (id) ON DELETE CASCADE,
    account_id      VARCHAR(100) NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    status          VARCHAR(20) NOT NULL DEFAULT 'REQUESTED',
    reason          VARCHAR(80) NOT NULL,
    note            VARCHAR(1000),
    review_note     VARCHAR(1000),
    reviewed_by     VARCHAR(100) REFERENCES accounts (id) ON DELETE SET NULL,
    reviewed_at     TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_return_status CHECK (
        UPPER(status) IN ('REQUESTED', 'APPROVED', 'REJECTED', 'CANCELLED')
    )
);

CREATE INDEX IF NOT EXISTS idx_return_order
    ON order_return_requests (order_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_return_status
    ON order_return_requests (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_return_account
    ON order_return_requests (account_id, created_at DESC);

CREATE TABLE IF NOT EXISTS order_return_items (
    return_id       BIGINT NOT NULL REFERENCES order_return_requests (id) ON DELETE CASCADE,
    order_item_id   BIGINT NOT NULL REFERENCES store_order_items (id) ON DELETE CASCADE,
    quantity        INTEGER NOT NULL CHECK (quantity > 0),
    PRIMARY KEY (return_id, order_item_id)
);

CREATE INDEX IF NOT EXISTS idx_return_items_order_item
    ON order_return_items (order_item_id);
