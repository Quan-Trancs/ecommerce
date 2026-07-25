-- Track processor refund metadata on approved returns

ALTER TABLE order_return_requests
    ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(12, 2),
    ADD COLUMN IF NOT EXISTS refund_id VARCHAR(120),
    ADD COLUMN IF NOT EXISTS refund_status VARCHAR(40),
    ADD COLUMN IF NOT EXISTS refund_skipped BOOLEAN NOT NULL DEFAULT FALSE;
