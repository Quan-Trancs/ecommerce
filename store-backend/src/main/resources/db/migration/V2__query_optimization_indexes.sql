-- V2 previously created indexes on legacy bookstore tables (books/authors/publishers).
-- Those entities are removed; keep this version as a no-op so Flyway history stays contiguous.
-- Fresh installs: safe. Existing installs that applied the old V2: run `flyway repair` once if checksum fails.

SELECT 1;
