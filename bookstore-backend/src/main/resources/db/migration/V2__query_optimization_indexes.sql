-- ============================================================================
-- Query Optimization Indexes Migration
-- ============================================================================
-- This migration adds composite indexes and full-text search indexes
-- for better query performance in the BookStoreBackEnd application.

-- ============================================================================
-- COMPOSITE INDEXES FOR COMMON QUERY PATTERNS
-- ============================================================================

-- Book table composite indexes
CREATE INDEX IF NOT EXISTS idx_book_title_publisher ON books(title, publisher_id);
CREATE INDEX IF NOT EXISTS idx_book_price_stock ON books(price, stock_quantity);
CREATE INDEX IF NOT EXISTS idx_book_language_format ON books(language, format);
CREATE INDEX IF NOT EXISTS idx_book_publication_price ON books(publication_date, price);
CREATE INDEX IF NOT EXISTS idx_book_discount_stock ON books(discount_percentage, stock_quantity);

-- Join table composite indexes for better join performance
CREATE INDEX IF NOT EXISTS idx_book_authors_composite ON book_authors(book_id, author_id);
CREATE INDEX IF NOT EXISTS idx_book_genres_composite ON book_genres(book_id, genre_id);
CREATE INDEX IF NOT EXISTS idx_book_authors_author ON book_authors(author_id);
CREATE INDEX IF NOT EXISTS idx_book_genres_genre ON book_genres(genre_id);

-- Author table composite indexes
CREATE INDEX IF NOT EXISTS idx_author_name_country ON authors(name, country);
CREATE INDEX IF NOT EXISTS idx_author_birth_death ON authors(birth_date, death_date);

-- Publisher table composite indexes
CREATE INDEX IF NOT EXISTS idx_publisher_name_country ON publishers(name, country);
CREATE INDEX IF NOT EXISTS idx_publisher_city_country ON publishers(city, country);
CREATE INDEX IF NOT EXISTS idx_publisher_founded_active ON publishers(founded_year, is_active);

-- ============================================================================
-- FULL-TEXT SEARCH INDEXES
-- ============================================================================

-- Create full-text search indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_book_title_fts ON books USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_book_description_fts ON books USING gin(to_tsvector('english', description));
CREATE INDEX IF NOT EXISTS idx_author_name_fts ON authors USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_author_biography_fts ON authors USING gin(to_tsvector('english', biography));
CREATE INDEX IF NOT EXISTS idx_publisher_name_fts ON publishers USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_publisher_description_fts ON publishers USING gin(to_tsvector('english', description));

-- ============================================================================
-- PARTIAL INDEXES FOR COMMON FILTERS
-- ============================================================================

-- Partial indexes for active records
CREATE INDEX IF NOT EXISTS idx_books_active ON books(id, title, price) WHERE stock_quantity > 0;
CREATE INDEX IF NOT EXISTS idx_authors_active ON authors(id, name) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_publishers_active ON publishers(id, name) WHERE is_active = true;

-- Partial indexes for discounted books
CREATE INDEX IF NOT EXISTS idx_books_discounted ON books(id, title, price, discount_percentage) WHERE discount_percentage > 0;

-- Partial indexes for low stock books
CREATE INDEX IF NOT EXISTS idx_books_low_stock ON books(id, title, stock_quantity) WHERE stock_quantity <= reorder_point;

-- ============================================================================
-- FUNCTIONAL INDEXES FOR COMPLEX QUERIES
-- ============================================================================

-- Case-insensitive search indexes
CREATE INDEX IF NOT EXISTS idx_book_title_lower ON books(LOWER(title));
CREATE INDEX IF NOT EXISTS idx_author_name_lower ON authors(LOWER(name));
CREATE INDEX IF NOT EXISTS idx_publisher_name_lower ON publishers(LOWER(name));

-- Date-based indexes
CREATE INDEX IF NOT EXISTS idx_book_created_at_date ON books(DATE(created_at));
CREATE INDEX IF NOT EXISTS idx_book_publication_year ON books(EXTRACT(YEAR FROM publication_date));

-- ============================================================================
-- STATISTICS AND ANALYTICS INDEXES
-- ============================================================================

-- Indexes for price analytics
CREATE INDEX IF NOT EXISTS idx_book_price_range ON books(price) WHERE price BETWEEN 0 AND 1000;
CREATE INDEX IF NOT EXISTS idx_book_price_high ON books(price) WHERE price > 1000;

-- Indexes for stock analytics
CREATE INDEX IF NOT EXISTS idx_book_stock_analytics ON books(stock_quantity, price, discount_percentage);

-- ============================================================================
-- PERFORMANCE MONITORING VIEWS
-- ============================================================================

-- Create a view for slow query monitoring
CREATE OR REPLACE VIEW v_slow_queries AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE idx_scan > 0
ORDER BY idx_scan DESC;

-- Create a view for table statistics
CREATE OR REPLACE VIEW v_table_stats AS
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_tuples,
    n_dead_tup as dead_tuples,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- ============================================================================
-- INDEX USAGE MONITORING
-- ============================================================================

-- Create a function to get index usage statistics
CREATE OR REPLACE FUNCTION get_index_usage_stats()
RETURNS TABLE (
    table_name text,
    index_name text,
    index_scans bigint,
    tuples_read bigint,
    tuples_fetched bigint,
    usage_percentage numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ui.tablename::text,
        ui.indexname::text,
        ui.idx_scan,
        ui.idx_tup_read,
        ui.idx_tup_fetch,
        CASE 
            WHEN ui.idx_scan > 0 THEN 
                ROUND((ui.idx_tup_fetch::numeric / ui.idx_tup_read::numeric) * 100, 2)
            ELSE 0 
        END as usage_percentage
    FROM pg_stat_user_indexes ui
    ORDER BY ui.idx_scan DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INDEX MAINTENANCE FUNCTIONS
-- ============================================================================

-- Function to analyze all tables
CREATE OR REPLACE FUNCTION analyze_all_tables()
RETURNS void AS $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE 'ANALYZE ' || table_record.tablename;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to vacuum all tables
CREATE OR REPLACE FUNCTION vacuum_all_tables()
RETURNS void AS $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE 'VACUUM ANALYZE ' || table_record.tablename;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON INDEX idx_book_title_publisher IS 'Composite index for queries filtering by title and publisher';
COMMENT ON INDEX idx_book_price_stock IS 'Composite index for price range and stock queries';
COMMENT ON INDEX idx_book_language_format IS 'Composite index for language and format filters';
COMMENT ON INDEX idx_book_publication_price IS 'Composite index for publication date and price queries';
COMMENT ON INDEX idx_book_discount_stock IS 'Composite index for discount and stock queries';

COMMENT ON INDEX idx_book_title_fts IS 'Full-text search index for book titles';
COMMENT ON INDEX idx_book_description_fts IS 'Full-text search index for book descriptions';
COMMENT ON INDEX idx_author_name_fts IS 'Full-text search index for author names';
COMMENT ON INDEX idx_publisher_name_fts IS 'Full-text search index for publisher names';

COMMENT ON INDEX idx_books_active IS 'Partial index for active books only';
COMMENT ON INDEX idx_books_discounted IS 'Partial index for discounted books only';
COMMENT ON INDEX idx_books_low_stock IS 'Partial index for low stock books only';

-- ============================================================================
-- MIGRATION COMPLETION
-- ============================================================================

-- Log the migration completion
INSERT INTO schema_version (version, description, installed_on) 
VALUES ('V2', 'Query optimization indexes', NOW())
ON CONFLICT (version) DO UPDATE SET 
    description = EXCLUDED.description,
    installed_on = EXCLUDED.installed_on; 