-- Partial line-item refunds

ALTER TABLE store_order_items
    ADD COLUMN IF NOT EXISTS refunded_quantity INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN store_order_items.refunded_quantity IS
    'Units already refunded/restocked on this line (cannot exceed quantity).';

CREATE TABLE IF NOT EXISTS order_refunds (
    id              BIGSERIAL PRIMARY KEY,
    order_id        VARCHAR(36) NOT NULL REFERENCES store_orders (id) ON DELETE CASCADE,
    processor       VARCHAR(40),
    refund_id       VARCHAR(120),
    refund_status   VARCHAR(40),
    amount          NUMERIC(12, 2) NOT NULL,
    recorded_by     VARCHAR(100),
    note            TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_refunds_order
    ON order_refunds (order_id, created_at DESC);

CREATE TABLE IF NOT EXISTS order_refund_items (
    id              BIGSERIAL PRIMARY KEY,
    refund_id       BIGINT NOT NULL REFERENCES order_refunds (id) ON DELETE CASCADE,
    order_item_id   BIGINT NOT NULL REFERENCES store_order_items (id) ON DELETE CASCADE,
    quantity        INTEGER NOT NULL CHECK (quantity > 0),
    unit_price      NUMERIC(10, 2) NOT NULL,
    line_amount     NUMERIC(12, 2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_refund_items_refund
    ON order_refund_items (refund_id);
