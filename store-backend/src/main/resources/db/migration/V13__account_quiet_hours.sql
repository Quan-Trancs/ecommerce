-- Quiet hours for order-note notification emails

ALTER TABLE accounts
    ADD COLUMN IF NOT EXISTS quiet_hours_enabled BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE accounts
    ADD COLUMN IF NOT EXISTS quiet_hours_start SMALLINT NOT NULL DEFAULT 22;

ALTER TABLE accounts
    ADD COLUMN IF NOT EXISTS quiet_hours_end SMALLINT NOT NULL DEFAULT 8;

ALTER TABLE accounts
    ADD COLUMN IF NOT EXISTS quiet_hours_timezone VARCHAR(64) NOT NULL DEFAULT 'UTC';
