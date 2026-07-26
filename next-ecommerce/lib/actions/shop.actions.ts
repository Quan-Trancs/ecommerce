'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { hasSellerAccess } from '@/lib/auth/roles'
import { formatError } from '@/lib/utils'
import {
  getSellerShop,
  listSellerShopProductIds,
  normalizeShopSearch,
  parseShopProductSort,
  shopHref,
  updateSellerShopProfile,
  type SellerShop,
  type ShopProductSort,
} from '@/lib/db/seller-shop'
import { getProductsByIds } from '@/lib/actions/product.actions'
import type { StoreProduct } from '@/lib/catalog/store-product'

export type { SellerShop, ShopProductSort }
export { shopHref, parseShopProductSort, normalizeShopSearch }

/** Load public shop by pretty slug or account id. */
export async function getPublicSellerShop(
  slugOrId: string,
  options?: {
    q?: string | null
    sort?: string | null
    inStock?: string | null
  }
): Promise<{
  shop: SellerShop
  products: StoreProduct[]
  query: string | null
  sort: ShopProductSort
  inStockOnly: boolean
} | null> {
  const shop = await getSellerShop(slugOrId)
  if (!shop) return null
  const queryText = normalizeShopSearch(options?.q)
  const sort = parseShopProductSort(options?.sort)
  const inStockOnly =
    options?.inStock === '1' ||
    options?.inStock === 'true' ||
    options?.inStock === 'yes'
  const ids = await listSellerShopProductIds(shop.accountId, {
    limit: 48,
    q: queryText,
    sort,
    inStockOnly,
  })
  const products = ids.length ? await getProductsByIds(ids) : []
  const byId = new Map(products.map((p) => [p._id, p]))
  const ordered = ids
    .map((id) => byId.get(id))
    .filter((p): p is StoreProduct => Boolean(p))
  return {
    shop,
    products: ordered,
    query: queryText,
    sort,
    inStockOnly,
  }
}

export async function getSellerShopSummary(
  accountId: string | null | undefined
): Promise<SellerShop | null> {
  if (!accountId?.trim()) return null
  return getSellerShop(accountId.trim())
}

export async function updateMySellerShop(input: {
  shopName: string
  shopSlug?: string
  bio?: string
}): Promise<{ success: boolean; message: string; shop?: SellerShop }> {
  try {
    const session = await auth()
    if (!session?.user?.id || !hasSellerAccess(session.user.role)) {
      return { success: false, message: 'Seller access required' }
    }
    const result = await updateSellerShopProfile({
      accountId: session.user.id,
      shopName: input.shopName,
      shopSlug: input.shopSlug,
      bio: input.bio,
    })
    if (result.error || !result.shop) {
      return {
        success: false,
        message: result.error || 'Shop profile not found',
      }
    }
    const shop = result.shop
    revalidatePath(shopHref(shop))
    revalidatePath(`/shop/${shop.accountId}`)
    revalidatePath('/seller')
    revalidatePath('/seller/products')
    return { success: true, message: 'Shop profile saved', shop }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

export async function getMySellerShop(): Promise<SellerShop | null> {
  const session = await auth()
  if (!session?.user?.id || !hasSellerAccess(session.user.role)) return null
  return getSellerShop(session.user.id)
}
