-- ============================================================================
-- BookStore Database Initialization (aligned with JPA entities)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "userRole" (
    "roleName" VARCHAR(50) PRIMARY KEY,
    "roleId" INTEGER NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS user2 (
    "userName" VARCHAR(100) PRIMARY KEY,
    password VARCHAR(255) NOT NULL,
    "roleId" INTEGER REFERENCES "userRole"("roleId"),
    key VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS publishers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    country VARCHAR(100),
    city VARCHAR(100),
    website VARCHAR(500),
    email VARCHAR(255),
    phone VARCHAR(50),
    founded_year INTEGER,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS authors (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    biography TEXT,
    birth_date DATE,
    death_date DATE,
    country VARCHAR(100),
    website VARCHAR(500),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "bookType" (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id VARCHAR(50) REFERENCES "bookType"(id),
    age_rating VARCHAR(10),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    sort_order INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS books (
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
    stock_quantity INTEGER DEFAULT 0 NOT NULL,
    reserved_quantity INTEGER DEFAULT 0 NOT NULL,
    reorder_point INTEGER DEFAULT 10 NOT NULL,
    max_stock INTEGER DEFAULT 100 NOT NULL,
    publisher_id BIGINT REFERENCES publishers(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    version BIGINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS book_authors (
    book_id VARCHAR(50) REFERENCES books(id) ON DELETE CASCADE,
    author_id BIGINT REFERENCES authors(id) ON DELETE CASCADE,
    PRIMARY KEY (book_id, author_id)
);

CREATE TABLE IF NOT EXISTS book_genres (
    book_id VARCHAR(50) REFERENCES books(id) ON DELETE CASCADE,
    genre_id VARCHAR(50) REFERENCES "bookType"(id) ON DELETE CASCADE,
    PRIMARY KEY (book_id, genre_id)
);

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

CREATE INDEX IF NOT EXISTS idx_user_role_id ON user2("roleId");
CREATE INDEX IF NOT EXISTS idx_user_key ON user2(key);
CREATE INDEX IF NOT EXISTS idx_publisher_name ON publishers(name);
CREATE INDEX IF NOT EXISTS idx_publisher_country ON publishers(country);
CREATE INDEX IF NOT EXISTS idx_publisher_city ON publishers(city);
CREATE INDEX IF NOT EXISTS idx_author_name ON authors(name);
CREATE INDEX IF NOT EXISTS idx_author_country ON authors(country);
CREATE INDEX IF NOT EXISTS idx_booktype_name ON "bookType"(name);
CREATE INDEX IF NOT EXISTS idx_book_title ON books(title);
CREATE INDEX IF NOT EXISTS idx_book_isbn ON books(isbn);
CREATE INDEX IF NOT EXISTS idx_book_isbn13 ON books(isbn13);
CREATE INDEX IF NOT EXISTS idx_book_publisher ON books(publisher_id);
CREATE INDEX IF NOT EXISTS idx_book_publication_date ON books(publication_date);
CREATE INDEX IF NOT EXISTS idx_book_language ON books(language);
CREATE INDEX IF NOT EXISTS idx_book_format ON books(format);
CREATE INDEX IF NOT EXISTS idx_book_price ON books(price);
CREATE INDEX IF NOT EXISTS idx_book_stock ON books(stock_quantity);
CREATE INDEX IF NOT EXISTS idx_task_user ON async_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_task_status ON async_tasks(status);

INSERT INTO "userRole" ("roleName", "roleId") VALUES
('admin', 1),
('manager', 2),
('customer', 3),
('staff', 4)
ON CONFLICT ("roleName") DO NOTHING;

INSERT INTO publishers (name, description, country, city, website, founded_year, is_active, created_at)
SELECT * FROM (VALUES
('Penguin Random House', 'One of the largest publishing companies in the world', 'USA', 'New York', 'https://www.penguinrandomhouse.com', 2013, TRUE, CURRENT_TIMESTAMP),
('HarperCollins', 'Major publishing company with global reach', 'USA', 'New York', 'https://www.harpercollins.com', 1817, TRUE, CURRENT_TIMESTAMP),
('Simon & Schuster', 'Leading publisher of books and digital content', 'USA', 'New York', 'https://www.simonandschuster.com', 1924, TRUE, CURRENT_TIMESTAMP),
('Macmillan Publishers', 'International publishing company', 'UK', 'London', 'https://www.macmillan.com', 1843, TRUE, CURRENT_TIMESTAMP)
) AS v(name, description, country, city, website, founded_year, is_active, created_at)
WHERE NOT EXISTS (SELECT 1 FROM publishers LIMIT 1);

INSERT INTO authors (name, biography, country, website, is_active, created_at)
SELECT * FROM (VALUES
('J.K. Rowling', 'British author best known for the Harry Potter series', 'UK', 'https://www.jkrowling.com', TRUE, CURRENT_TIMESTAMP),
('Stephen King', 'American author of horror, supernatural fiction, suspense, and fantasy novels', 'USA', 'https://stephenking.com', TRUE, CURRENT_TIMESTAMP),
('Agatha Christie', 'English writer known for her detective novels', 'UK', NULL, TRUE, CURRENT_TIMESTAMP),
('George R.R. Martin', 'American novelist and short story writer', 'USA', 'https://georgerrmartin.com', TRUE, CURRENT_TIMESTAMP)
) AS v(name, biography, country, website, is_active, created_at)
WHERE NOT EXISTS (SELECT 1 FROM authors LIMIT 1);

INSERT INTO "bookType" (id, name, description, age_rating, is_active, created_at) VALUES
('fiction', 'Fiction', 'General fiction literature', 'G', TRUE, CURRENT_TIMESTAMP),
('mystery', 'Mystery', 'Books involving crime solving', 'PG', TRUE, CURRENT_TIMESTAMP),
('fantasy', 'Fantasy', 'Books with magical and supernatural elements', 'PG', TRUE, CURRENT_TIMESTAMP),
('horror', 'Horror', 'Books intended to scare or frighten', 'R', TRUE, CURRENT_TIMESTAMP),
('romance', 'Romance', 'Books focusing on romantic relationships', 'PG', TRUE, CURRENT_TIMESTAMP),
('scifi', 'Science Fiction', 'Books with futuristic and scientific themes', 'PG', TRUE, CURRENT_TIMESTAMP),
('nonfiction', 'Non-fiction', 'Factual and educational books', 'G', TRUE, CURRENT_TIMESTAMP),
('biography', 'Biography', 'Books about real people and their lives', 'G', TRUE, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

INSERT INTO books (id, title, subtitle, isbn, isbn13, description, page_count, language, publication_date, edition, format, price, original_price, discount_percentage, stock_quantity, reserved_quantity, reorder_point, max_stock, publisher_id, created_at, version) VALUES
('BOOK001', 'Harry Potter and the Philosopher''s Stone', 'The first book in the Harry Potter series', '0747532699', '9780747532699', 'The story of a young wizard discovering his magical heritage', 223, 'en', '1997-06-26', '1st', 'Hardcover', 24.99, 29.99, 17, 50, 0, 10, 100, 1, CURRENT_TIMESTAMP, 0),
('BOOK002', 'The Shining', 'A horror novel by Stephen King', '0385121679', '9780385121675', 'A psychological horror novel about a family in an isolated hotel', 447, 'en', '1977-01-28', '1st', 'Hardcover', 24.99, 24.99, 0, 30, 0, 10, 100, 2, CURRENT_TIMESTAMP, 0),
('BOOK003', 'Murder on the Orient Express', 'A Hercule Poirot mystery', '0062073494', '9780062073495', 'A detective novel featuring the famous Belgian detective', 274, 'en', '1934-01-01', '1st', 'Paperback', 14.99, 19.99, 25, 75, 0, 10, 100, 3, CURRENT_TIMESTAMP, 0),
('BOOK004', 'A Game of Thrones', 'Book One of A Song of Ice and Fire', '0553103547', '9780553103540', 'The first book in the epic fantasy series', 694, 'en', '1996-08-01', '1st', 'Hardcover', 34.99, 34.99, 0, 25, 0, 10, 100, 4, CURRENT_TIMESTAMP, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO book_authors (book_id, author_id) VALUES
('BOOK001', 1),
('BOOK002', 2),
('BOOK003', 3),
('BOOK004', 4)
ON CONFLICT DO NOTHING;

INSERT INTO book_genres (book_id, genre_id) VALUES
('BOOK001', 'fantasy'),
('BOOK002', 'horror'),
('BOOK003', 'mystery'),
('BOOK004', 'fantasy')
ON CONFLICT DO NOTHING;

INSERT INTO user2 ("userName", password, "roleId", key) VALUES
('admin', 'admin123', 1, 'admin123'),
('manager', 'manager123', 2, 'manager123'),
('customer', 'customer123', 3, 'customer123')
ON CONFLICT ("userName") DO NOTHING;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO store_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO store_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO store_user;
