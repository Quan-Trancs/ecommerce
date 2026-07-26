-- Optional public social / website links for seller shops

ALTER TABLE seller_profiles
    ADD COLUMN IF NOT EXISTS website_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS instagram_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS x_url VARCHAR(500);
