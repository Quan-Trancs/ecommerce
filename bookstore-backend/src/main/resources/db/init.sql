-- ============================================================================
-- BookStore Database Initialization Script
-- ============================================================================

-- Create database (run this as superuser)
-- CREATE DATABASE bookstore;
-- CREATE USER bookstore_user WITH PASSWORD 'your_secure_password';
-- GRANT ALL PRIVILEGES ON DATABASE bookstore TO bookstore_user;

-- Connect to the bookstore database
-- \c bookstore;

-- ============================================================================
-- USER ROLES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_role (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS user2 (
    user_name VARCHAR(100) PRIMARY KEY,
    password VARCHAR(255) NOT NULL,
    role_id INTEGER REFERENCES user_role(role_id),
    key VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PUBLISHERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS publishers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    country VARCHAR(100),
    city VARCHAR(100),
    website VARCHAR(500),
    founded_year INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- AUTHORS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS authors (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    biography TEXT,
    birth_date DATE,
    death_date DATE,
    country VARCHAR(100),
    website VARCHAR(500),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- BOOK TYPES (GENRES) TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS book_type (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id VARCHAR(50) REFERENCES book_type(id),
    age_rating VARCHAR(10),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- BOOKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS book (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    subtitle VARCHAR(500),
    isbn VARCHAR(20) UNIQUE,
    isbn13 VARCHAR(20) UNIQUE,
    description TEXT,
    page_count INTEGER,
    language VARCHAR(10),
    publication_date DATE,
    edition VARCHAR(50),
    format VARCHAR(50),
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),
    discount_percentage INTEGER DEFAULT 0,
    stock_quantity INTEGER DEFAULT 0,
    reserved_quantity INTEGER DEFAULT 0,
    reorder_point INTEGER DEFAULT 10,
    max_stock INTEGER DEFAULT 1000,
    publisher_id BIGINT REFERENCES publishers(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- BOOK-AUTHOR RELATIONSHIP TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS book_authors (
    book_id VARCHAR(50) REFERENCES book(id) ON DELETE CASCADE,
    author_id BIGINT REFERENCES authors(id) ON DELETE CASCADE,
    PRIMARY KEY (book_id, author_id)
);

-- ============================================================================
-- BOOK-GENRE RELATIONSHIP TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS book_genres (
    book_id VARCHAR(50) REFERENCES book(id) ON DELETE CASCADE,
    genre_id VARCHAR(50) REFERENCES book_type(id) ON DELETE CASCADE,
    PRIMARY KEY (book_id, genre_id)
);

-- ============================================================================
-- ASYNC TASKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS async_tasks (
    task_id VARCHAR(36) PRIMARY KEY,
    request_type VARCHAR(50) NOT NULL,
    data TEXT,
    user_id VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL,
    result TEXT,
    completed_at TIMESTAMP,
    progress INTEGER DEFAULT 0,
    version BIGINT DEFAULT 0
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User indexes
CREATE INDEX IF NOT EXISTS idx_user_role_id ON user2(role_id);
CREATE INDEX IF NOT EXISTS idx_user_key ON user2(key);

-- Publisher indexes
CREATE INDEX IF NOT EXISTS idx_publisher_name ON publishers(name);
CREATE INDEX IF NOT EXISTS idx_publisher_country ON publishers(country);
CREATE INDEX IF NOT EXISTS idx_publisher_city ON publishers(city);
CREATE INDEX IF NOT EXISTS idx_publisher_active ON publishers(is_active);

-- Author indexes
CREATE INDEX IF NOT EXISTS idx_author_name ON authors(name);
CREATE INDEX IF NOT EXISTS idx_author_country ON authors(country);
CREATE INDEX IF NOT EXISTS idx_author_birth_date ON authors(birth_date);
CREATE INDEX IF NOT EXISTS idx_author_active ON authors(is_active);

-- Book type indexes
CREATE INDEX IF NOT EXISTS idx_booktype_name ON book_type(name);
CREATE INDEX IF NOT EXISTS idx_booktype_parent ON book_type(parent_id);
CREATE INDEX IF NOT EXISTS idx_booktype_active ON book_type(is_active);

-- Book indexes
CREATE INDEX IF NOT EXISTS idx_book_title ON book(title);
CREATE INDEX IF NOT EXISTS idx_book_isbn ON book(isbn);
CREATE INDEX IF NOT EXISTS idx_book_isbn13 ON book(isbn13);
CREATE INDEX IF NOT EXISTS idx_book_publisher ON book(publisher_id);
CREATE INDEX IF NOT EXISTS idx_book_publication_date ON book(publication_date);
CREATE INDEX IF NOT EXISTS idx_book_language ON book(language);
CREATE INDEX IF NOT EXISTS idx_book_format ON book(format);
CREATE INDEX IF NOT EXISTS idx_book_price ON book(price);
CREATE INDEX IF NOT EXISTS idx_book_stock ON book(stock_quantity);
CREATE INDEX IF NOT EXISTS idx_book_created_at ON book(created_at);

-- Relationship indexes
CREATE INDEX IF NOT EXISTS idx_book_authors_book ON book_authors(book_id);
CREATE INDEX IF NOT EXISTS idx_book_authors_author ON book_authors(author_id);
CREATE INDEX IF NOT EXISTS idx_book_genres_book ON book_genres(book_id);
CREATE INDEX IF NOT EXISTS idx_book_genres_genre ON book_genres(genre_id);

-- Async task indexes
CREATE INDEX IF NOT EXISTS idx_task_user ON async_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_task_status ON async_tasks(status);
CREATE INDEX IF NOT EXISTS idx_task_created ON async_tasks(created_at);

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- Insert user roles
INSERT INTO user_role (role_name, description) VALUES
('admin', 'Administrator with full access'),
('manager', 'Store manager with inventory access'),
('customer', 'Regular customer'),
('staff', 'Store staff member')
ON CONFLICT (role_name) DO NOTHING;

-- Insert sample publishers
INSERT INTO publishers (name, description, country, city, website, founded_year) VALUES
('Penguin Random House', 'One of the largest publishing companies in the world', 'USA', 'New York', 'https://www.penguinrandomhouse.com', 2013),
('HarperCollins', 'Major publishing company with global reach', 'USA', 'New York', 'https://www.harpercollins.com', 1817),
('Simon & Schuster', 'Leading publisher of books and digital content', 'USA', 'New York', 'https://www.simonandschuster.com', 1924),
('Macmillan Publishers', 'International publishing company', 'UK', 'London', 'https://www.macmillan.com', 1843)
ON CONFLICT DO NOTHING;

-- Insert sample authors
INSERT INTO authors (name, biography, country, website) VALUES
('J.K. Rowling', 'British author best known for the Harry Potter series', 'UK', 'https://www.jkrowling.com'),
('Stephen King', 'American author of horror, supernatural fiction, suspense, and fantasy novels', 'USA', 'https://stephenking.com'),
('Agatha Christie', 'English writer known for her detective novels', 'UK', NULL),
('George R.R. Martin', 'American novelist and short story writer', 'USA', 'https://georgerrmartin.com')
ON CONFLICT DO NOTHING;

-- Insert sample book types/genres
INSERT INTO book_type (id, name, description, age_rating) VALUES
('fiction', 'Fiction books', 'General fiction literature', 'G'),
('mystery', 'Mystery and detective fiction', 'Books involving crime solving', 'PG'),
('fantasy', 'Fantasy literature', 'Books with magical and supernatural elements', 'PG'),
('horror', 'Horror fiction', 'Books intended to scare or frighten', 'R'),
('romance', 'Romance novels', 'Books focusing on romantic relationships', 'PG'),
('scifi', 'Science fiction', 'Books with futuristic and scientific themes', 'PG'),
('nonfiction', 'Non-fiction books', 'Factual and educational books', 'G'),
('biography', 'Biographies and memoirs', 'Books about real people and their lives', 'G')
ON CONFLICT (id) DO NOTHING;

-- Insert sample books
INSERT INTO book (id, title, subtitle, isbn, isbn13, description, page_count, language, publication_date, edition, format, price, original_price, stock_quantity, publisher_id) VALUES
('BOOK001', 'Harry Potter and the Philosopher''s Stone', 'The first book in the Harry Potter series', '9780747532699', '978-0747532699', 'The story of a young wizard discovering his magical heritage', 223, 'en', '1997-06-26', '1st', 'Hardcover', 29.99, 29.99, 50, 1),
('BOOK002', 'The Shining', 'A horror novel by Stephen King', '9780385121675', '978-0385121675', 'A psychological horror novel about a family in an isolated hotel', 447, 'en', '1977-01-28', '1st', 'Hardcover', 24.99, 24.99, 30, 2),
('BOOK003', 'Murder on the Orient Express', 'A Hercule Poirot mystery', '9780062073495', '978-0062073495', 'A detective novel featuring the famous Belgian detective', 274, 'en', '1934-01-01', '1st', 'Paperback', 14.99, 19.99, 75, 3),
('BOOK004', 'A Game of Thrones', 'Book One of A Song of Ice and Fire', '9780553103540', '978-0553103540', 'The first book in the epic fantasy series', 694, 'en', '1996-08-01', '1st', 'Hardcover', 34.99, 34.99, 25, 4)
ON CONFLICT (id) DO NOTHING;

-- Link books to authors
INSERT INTO book_authors (book_id, author_id) VALUES
('BOOK001', 1),
('BOOK002', 2),
('BOOK003', 3),
('BOOK004', 4)
ON CONFLICT DO NOTHING;

-- Link books to genres
INSERT INTO book_genres (book_id, genre_id) VALUES
('BOOK001', 'fantasy'),
('BOOK002', 'horror'),
('BOOK003', 'mystery'),
('BOOK004', 'fantasy')
ON CONFLICT DO NOTHING;

-- Insert sample user
INSERT INTO user2 (user_name, password, role_id, key) VALUES
('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', 1, 'admin123'),
('manager', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', 2, 'manager123'),
('customer', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', 3, 'customer123')
ON CONFLICT (user_name) DO NOTHING;

-- ============================================================================
-- GRANTS FOR APPLICATION USER
-- ============================================================================
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO bookstore_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO bookstore_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO bookstore_user; 