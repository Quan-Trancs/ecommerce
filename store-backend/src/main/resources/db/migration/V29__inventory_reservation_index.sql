-- Speed scans that expire unpaid PENDING inventory reservations
CREATE INDEX IF NOT EXISTS idx_store_orders_unpaid_pending_created
    ON store_orders (created_at)
    WHERE status = 'PENDING' AND is_paid = FALSE;
