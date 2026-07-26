-- Wishlist price-drop alerts

ALTER TABLE accounts
    ADD COLUMN IF NOT EXISTS notify_price_drops BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN accounts.notify_price_drops IS
    'When true, email + in-app when a wishlisted product price drops.';

ALTER TABLE wishlist_items
    ADD COLUMN IF NOT EXISTS watched_price NUMERIC(12, 2);

ALTER TABLE wishlist_items
    ADD COLUMN IF NOT EXISTS last_alerted_price NUMERIC(12, 2);

ALTER TABLE wishlist_items
    ADD COLUMN IF NOT EXISTS last_price_alert_at TIMESTAMP;

-- Baseline = price when saved (backfill existing rows)
UPDATE wishlist_items w
SET watched_price = p.price
FROM products p
WHERE w.product_id = p.id
  AND w.watched_price IS NULL
  AND p.price IS NOT NULL;
