-- Persistent carts per account (guest carts stay in browser localStorage)

CREATE TABLE IF NOT EXISTS carts (
    id                   VARCHAR(36)  PRIMARY KEY,
    user_id              VARCHAR(100) NOT NULL,
    payment_method       VARCHAR(50),
    delivery_date_index  INTEGER,
    shipping_full_name   VARCHAR(200),
    shipping_address     VARCHAR(500),
    shipping_city        VARCHAR(100),
    shipping_postal_code  VARCHAR(30),
    shipping_country     VARCHAR(100),
    shipping_phone       VARCHAR(50),
    created_at           TIMESTAMP    NOT NULL,
    updated_at           TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_carts_user_id ON carts (user_id);
CREATE INDEX IF NOT EXISTS idx_carts_user ON carts (user_id);

CREATE TABLE IF NOT EXISTS cart_items (
    id              VARCHAR(36)   PRIMARY KEY,
    cart_id         VARCHAR(36)   NOT NULL REFERENCES carts (id) ON DELETE CASCADE,
    client_id       VARCHAR(100)  NOT NULL,
    product_id      VARCHAR(100)  NOT NULL,
    name            VARCHAR(300)  NOT NULL,
    slug            VARCHAR(320)  NOT NULL,
    image           VARCHAR(1000) NOT NULL,
    category        VARCHAR(200)  NOT NULL DEFAULT 'General',
    price           NUMERIC(12, 2) NOT NULL,
    quantity        INTEGER       NOT NULL,
    count_in_stock  INTEGER       NOT NULL DEFAULT 0,
    color           VARCHAR(100),
    size            VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart_items (cart_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_cart_item_line
    ON cart_items (cart_id, product_id, COALESCE(color, ''), COALESCE(size, ''));
