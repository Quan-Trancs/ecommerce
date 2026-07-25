-- Order support notes / buyer–staff ticket thread

CREATE TABLE IF NOT EXISTS store_order_notes (
    id              BIGSERIAL PRIMARY KEY,
    order_id        VARCHAR(36) NOT NULL REFERENCES store_orders (id) ON DELETE CASCADE,
    author_user_id  VARCHAR(100) NOT NULL,
    author_role     VARCHAR(20) NOT NULL,
    body            TEXT NOT NULL,
    created_at      TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_note_order ON store_order_notes (order_id);
CREATE INDEX IF NOT EXISTS idx_order_note_created ON store_order_notes (order_id, created_at);
