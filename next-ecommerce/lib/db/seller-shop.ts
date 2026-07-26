import { query } from '@/lib/db/postgres'
import { toSlug } from '@/lib/utils'

export type SellerShop = {
  accountId: string
  shopSlug: string
  shopName: string
  bio: string | null
  shopBannerUrl: string | null
  shopLogoUrl: string | null
  verified: boolean
  productCount: number
}

const RESERVED_SHOP_SLUGS = new Set([
  'new',
  'edit',
  'settings',
  'admin',
  'seller',
  'api',
  'shop',
])

export function normalizeShopSlug(raw: string): string {
  return toSlug(raw).slice(0, 120)
}

export function shopHref(shop: Pick<SellerShop, 'shopSlug' | 'accountId'>): string {
  return `/shop/${shop.shopSlug || shop.accountId}`
}

function mapShop(row: {
  account_id: string
  shop_slug: string | null
  shop_name: string
  bio: string | null
  shop_banner_url: string | null
  shop_logo_url: string | null
  verified: boolean
  product_count: string
}): SellerShop {
  return {
    accountId: row.account_id,
    shopSlug: row.shop_slug?.trim() || row.account_id,
    shopName: row.shop_name?.trim() || 'Shop',
    bio: row.bio?.trim() || null,
    shopBannerUrl: row.shop_banner_url?.trim() || null,
    shopLogoUrl: row.shop_logo_url?.trim() || null,
    verified: Boolean(row.verified),
    productCount: Number(row.product_count) || 0,
  }
}

const SHOP_SELECT = `
  SELECT sp.account_id,
         sp.shop_slug,
         sp.shop_name,
         sp.bio,
         sp.shop_banner_url,
         sp.shop_logo_url,
         COALESCE(sp.verified, FALSE) AS verified,
         (
           SELECT COUNT(*)::text
           FROM products p
           WHERE p.seller_account_id = sp.account_id
             AND COALESCE(p.is_published, TRUE) = TRUE
         ) AS product_count
  FROM seller_profiles sp
  JOIN accounts a ON a.id = sp.account_id
`

/** Resolve by pretty slug or legacy account id. */
export async function getSellerShop(
  slugOrAccountId: string
): Promise<SellerShop | null> {
  const key = slugOrAccountId.trim()
  if (!key) return null

  const result = await query<{
    account_id: string
    shop_slug: string | null
    shop_name: string
    bio: string | null
    shop_banner_url: string | null
    shop_logo_url: string | null
    verified: boolean
    product_count: string
  }>(
    `${SHOP_SELECT}
     WHERE COALESCE(a.active, TRUE) = TRUE
       AND (sp.shop_slug = $1 OR sp.account_id = $1)
     ORDER BY CASE WHEN sp.shop_slug = $1 THEN 0 ELSE 1 END
     LIMIT 1`,
    [key]
  )
  const row = result.rows[0]
  return row ? mapShop(row) : null
}

export type ShopProductSort = 'newest' | 'price-asc' | 'price-desc' | 'name'

export function parseShopProductSort(value?: string | null): ShopProductSort {
  const v = (value || '').trim().toLowerCase()
  if (v === 'price-asc' || v === 'price-desc' || v === 'name') return v
  return 'newest'
}

export function normalizeShopSearch(q?: string | null): string | null {
  const trimmed = (q || '').trim().slice(0, 80)
  if (!trimmed) return null
  const cleaned = trimmed.replace(/[%_]/g, ' ').replace(/\s+/g, ' ').trim()
  return cleaned || null
}

/** Published product ids for a seller shop with optional search/sort/stock filter. */
export async function listSellerShopProductIds(
  accountId: string,
  options?: {
    limit?: number
    q?: string | null
    sort?: ShopProductSort
    inStockOnly?: boolean
  }
): Promise<string[]> {
  const limit = Math.max(1, Math.min(options?.limit ?? 48, 100))
  const search = normalizeShopSearch(options?.q)
  const sort = options?.sort || 'newest'
  const params: unknown[] = [accountId]
  let searchClause = ''
  if (search) {
    params.push(`%${search}%`)
    searchClause = ` AND (
      p.name ILIKE $2
      OR COALESCE(p.description, '') ILIKE $2
    )`
  }
  const stockClause = options?.inStockOnly
    ? ' AND COALESCE(p.stock_quantity, 0) > 0'
    : ''

  let orderClause =
    'ORDER BY p.updated_at DESC NULLS LAST, p.created_at DESC NULLS LAST'
  if (sort === 'price-asc') {
    orderClause = 'ORDER BY p.price ASC NULLS LAST, p.name ASC'
  } else if (sort === 'price-desc') {
    orderClause = 'ORDER BY p.price DESC NULLS LAST, p.name ASC'
  } else if (sort === 'name') {
    orderClause = 'ORDER BY p.name ASC'
  }

  params.push(limit)
  const limitParam = `$${params.length}`

  const result = await query<{ id: string }>(
    `SELECT p.id
     FROM products p
     WHERE p.seller_account_id = $1
       AND COALESCE(p.is_published, TRUE) = TRUE
       ${searchClause}
       ${stockClause}
     ${orderClause}
     LIMIT ${limitParam}`,
    params
  )
  return result.rows.map((row) => row.id)
}

export async function isShopSlugTaken(
  slug: string,
  excludeAccountId?: string
): Promise<boolean> {
  const normalized = normalizeShopSlug(slug)
  if (!normalized) return true
  if (RESERVED_SHOP_SLUGS.has(normalized)) return true
  const result = await query(
    excludeAccountId
      ? `SELECT 1 FROM seller_profiles
         WHERE shop_slug = $1 AND account_id <> $2
         LIMIT 1`
      : `SELECT 1 FROM seller_profiles WHERE shop_slug = $1 LIMIT 1`,
    excludeAccountId ? [normalized, excludeAccountId] : [normalized]
  )
  return (result.rowCount || 0) > 0
}

/** Allocate a unique slug from a preferred base (appends -2, -3, …). */
export async function allocateUniqueShopSlug(
  preferred: string,
  excludeAccountId?: string
): Promise<string> {
  let base = normalizeShopSlug(preferred) || 'shop'
  if (RESERVED_SHOP_SLUGS.has(base)) base = `shop-${base}`
  base = base.slice(0, 110)

  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`
    if (!(await isShopSlugTaken(candidate, excludeAccountId))) {
      return candidate
    }
  }
  return `${base}-${Date.now().toString(36)}`.slice(0, 120)
}

export async function updateSellerShopProfile(input: {
  accountId: string
  shopName: string
  shopSlug?: string
  bio?: string | null
}): Promise<{ shop: SellerShop | null; error?: string }> {
  const shopName = input.shopName.trim().slice(0, 200)
  if (!shopName) return { shop: null, error: 'Shop name required' }
  const bio = (input.bio || '').trim().slice(0, 500) || null

  let shopSlug: string
  if (input.shopSlug != null && input.shopSlug.trim()) {
    shopSlug = normalizeShopSlug(input.shopSlug)
    if (!shopSlug || shopSlug.length < 2) {
      return { shop: null, error: 'Slug must be at least 2 characters' }
    }
    if (RESERVED_SHOP_SLUGS.has(shopSlug)) {
      return { shop: null, error: 'That slug is reserved' }
    }
    if (await isShopSlugTaken(shopSlug, input.accountId)) {
      return { shop: null, error: 'That slug is already taken' }
    }
  } else {
    const current = await getSellerShop(input.accountId)
    shopSlug =
      current?.shopSlug ||
      (await allocateUniqueShopSlug(shopName, input.accountId))
  }

  await query(
    `UPDATE seller_profiles
     SET shop_name = $2,
         shop_slug = $3,
         bio = $4,
         updated_at = NOW()
     WHERE account_id = $1`,
    [input.accountId, shopName, shopSlug, bio]
  )
  return { shop: await getSellerShop(input.accountId) }
}

export async function updateSellerShopBanner(
  accountId: string,
  shopBannerUrl: string | null
): Promise<SellerShop | null> {
  const url = shopBannerUrl?.trim().slice(0, 1000) || null
  await query(
    `UPDATE seller_profiles
     SET shop_banner_url = $2,
         updated_at = NOW()
     WHERE account_id = $1`,
    [accountId, url]
  )
  return getSellerShop(accountId)
}

export async function updateSellerShopLogo(
  accountId: string,
  shopLogoUrl: string | null
): Promise<SellerShop | null> {
  const url = shopLogoUrl?.trim().slice(0, 1000) || null
  await query(
    `UPDATE seller_profiles
     SET shop_logo_url = $2,
         updated_at = NOW()
     WHERE account_id = $1`,
    [accountId, url]
  )
  return getSellerShop(accountId)
}
