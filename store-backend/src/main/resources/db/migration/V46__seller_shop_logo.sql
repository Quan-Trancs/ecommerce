-- Optional logo/avatar for public seller shops

ALTER TABLE seller_profiles
    ADD COLUMN IF NOT EXISTS shop_logo_url VARCHAR(1000);
