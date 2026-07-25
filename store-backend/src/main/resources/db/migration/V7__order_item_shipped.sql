-- Per-line fulfillment so multi-seller orders can ship independently

ALTER TABLE store_order_items
    ADD COLUMN IF NOT EXISTS is_shipped BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE store_order_items
    ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_order_item_shipped ON store_order_items (is_shipped);
