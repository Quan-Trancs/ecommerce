-- Minimal Postgres bootstrap for the commercial store API.
-- Catalog/orders schema is created by Hibernate ddl-auto + Flyway migrations.
-- Demo catalog rows come from CatalogDataSeeder.

-- Application grants (run as superuser if needed):
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO store_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO store_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO store_user;

SELECT 1;
