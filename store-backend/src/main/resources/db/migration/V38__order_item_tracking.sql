-- Carrier + tracking on per-line fulfillment

ALTER TABLE store_order_items
    ADD COLUMN IF NOT EXISTS shipping_carrier VARCHAR(80);

ALTER TABLE store_order_items
    ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(120);
