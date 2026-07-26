-- Optional cover/banner image for public seller shops

ALTER TABLE seller_profiles
    ADD COLUMN IF NOT EXISTS shop_banner_url VARCHAR(1000);
