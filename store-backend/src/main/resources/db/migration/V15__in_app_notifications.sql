-- In-app notification center (order notes and related)

CREATE TABLE IF NOT EXISTS in_app_notifications (
    id              BIGSERIAL PRIMARY KEY,
    account_id      VARCHAR(100) NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    type            VARCHAR(40) NOT NULL DEFAULT 'ORDER_NOTE',
    title           VARCHAR(200) NOT NULL,
    body            TEXT NOT NULL,
    href            VARCHAR(500) NOT NULL,
    order_id        VARCHAR(36),
    note_id         BIGINT,
    urgent          BOOLEAN NOT NULL DEFAULT FALSE,
    read_at         TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_in_app_notif_account_created
    ON in_app_notifications (account_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_in_app_notif_account_unread
    ON in_app_notifications (account_id)
    WHERE read_at IS NULL;
