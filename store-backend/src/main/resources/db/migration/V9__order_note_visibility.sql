-- Staff-only internal notes on order support threads

ALTER TABLE store_order_notes
    ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) NOT NULL DEFAULT 'PUBLIC';

CREATE INDEX IF NOT EXISTS idx_order_note_visibility
    ON store_order_notes (order_id, visibility);
