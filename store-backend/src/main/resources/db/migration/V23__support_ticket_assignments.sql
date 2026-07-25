-- Per-order support ticket assignment (claim / release)

CREATE TABLE IF NOT EXISTS support_ticket_assignments (
    order_id        VARCHAR(100) PRIMARY KEY REFERENCES store_orders (id) ON DELETE CASCADE,
    assignee_id     VARCHAR(100) NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    assigned_by     VARCHAR(100) REFERENCES accounts (id) ON DELETE SET NULL,
    assigned_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_ticket_assignee
    ON support_ticket_assignments (assignee_id, assigned_at DESC);
