-- Pretty public shop URLs: /shop/{shop_slug}

ALTER TABLE seller_profiles
    ADD COLUMN IF NOT EXISTS shop_slug VARCHAR(120);

-- Backfill unique slugs from shop_name (fallback shop-{account})
WITH base AS (
    SELECT account_id,
           NULLIF(
               TRIM(BOTH '-' FROM LOWER(
                   REGEXP_REPLACE(COALESCE(shop_name, 'shop'), '[^a-zA-Z0-9]+', '-', 'g')
               )),
               ''
           ) AS base_slug
    FROM seller_profiles
),
numbered AS (
    SELECT account_id,
           COALESCE(base_slug, 'shop') AS base_slug,
           ROW_NUMBER() OVER (
               PARTITION BY COALESCE(base_slug, 'shop')
               ORDER BY account_id
           ) AS rn
    FROM base
)
UPDATE seller_profiles sp
SET shop_slug = CASE
    WHEN n.rn = 1 THEN LEFT(n.base_slug, 120)
    ELSE LEFT(n.base_slug, 110) || '-' || n.rn::text
END
FROM numbered n
WHERE sp.account_id = n.account_id
  AND (sp.shop_slug IS NULL OR TRIM(sp.shop_slug) = '');

ALTER TABLE seller_profiles
    ALTER COLUMN shop_slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_seller_profiles_shop_slug
    ON seller_profiles (shop_slug);
