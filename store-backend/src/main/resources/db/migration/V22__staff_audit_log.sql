-- Staff action audit log (support / admin)

CREATE TABLE IF NOT EXISTS staff_audit_log (
    id              BIGSERIAL PRIMARY KEY,
    actor_id        VARCHAR(100) REFERENCES accounts (id) ON DELETE SET NULL,
    actor_role      VARCHAR(20),
    action          VARCHAR(80) NOT NULL,
    entity_type     VARCHAR(40),
    entity_id       VARCHAR(100),
    summary         VARCHAR(500) NOT NULL,
    metadata_json   TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_audit_created
    ON staff_audit_log (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_staff_audit_actor
    ON staff_audit_log (actor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_staff_audit_entity
    ON staff_audit_log (entity_type, entity_id, created_at DESC);
