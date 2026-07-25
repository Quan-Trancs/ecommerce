-- Commercial orders + product variants
-- Compatible with JPA @Table names: store_orders, store_order_items, product_variants

CREATE TABLE IF NOT EXISTS store_orders (
    id                      VARCHAR(36) PRIMARY KEY,
    user_id                 VARCHAR(100) NOT NULL,
    status                  VARCHAR(20) NOT NULL,
    payment_method          VARCHAR(50),
    items_price             NUMERIC(12, 2) NOT NULL,
    shipping_price          NUMERIC(12, 2) NOT NULL DEFAULT 0,
    tax_price               NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_price             NUMERIC(12, 2) NOT NULL,
    shipping_full_name      VARCHAR(200),
    shipping_address        VARCHAR(500),
    shipping_city           VARCHAR(100),
    shipping_postal_code    VARCHAR(30),
    shipping_country        VARCHAR(100),
    shipping_phone          VARCHAR(50),
    expected_delivery_date  TIMESTAMP,
    is_paid                 BOOLEAN NOT NULL DEFAULT FALSE,
    paid_at                 TIMESTAMP,
    payment_result_json     TEXT,
    created_at              TIMESTAMP NOT NULL,
    updated_at              TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_user ON store_orders (user_id);
CREATE INDEX IF NOT EXISTS idx_order_status ON store_orders (status);
CREATE INDEX IF NOT EXISTS idx_order_created ON store_orders (created_at);

CREATE TABLE IF NOT EXISTS store_order_items (
    id          BIGSERIAL PRIMARY KEY,
    order_id    VARCHAR(36) NOT NULL REFERENCES store_orders (id) ON DELETE CASCADE,
    product_id  VARCHAR(50) NOT NULL,
    name        VARCHAR(300) NOT NULL,
    slug        VARCHAR(320),
    image       VARCHAR(500),
    price       NUMERIC(10, 2) NOT NULL,
    quantity    INTEGER NOT NULL,
    color       VARCHAR(50),
    size        VARCHAR(50)
);

CREATE INDEX IF NOT EXISTS idx_order_item_order ON store_order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_item_product ON store_order_items (product_id);

CREATE TABLE IF NOT EXISTS product_variants (
    id              BIGSERIAL PRIMARY KEY,
    product_id      VARCHAR(50) NOT NULL,
    sku             VARCHAR(100),
    color           VARCHAR(50),
    size            VARCHAR(50),
    price           NUMERIC(10, 2) NOT NULL,
    list_price      NUMERIC(10, 2),
    stock_quantity  INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_variant_product ON product_variants (product_id);
CREATE INDEX IF NOT EXISTS idx_variant_sku ON product_variants (sku);
CREATE INDEX IF NOT EXISTS idx_variant_color_size ON product_variants (product_id, color, size);
