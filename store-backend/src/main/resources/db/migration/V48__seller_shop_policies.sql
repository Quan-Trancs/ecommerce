-- Optional shipping / returns policy text for public seller shops

ALTER TABLE seller_profiles
    ADD COLUMN IF NOT EXISTS shipping_policy VARCHAR(2000),
    ADD COLUMN IF NOT EXISTS returns_policy VARCHAR(2000);
