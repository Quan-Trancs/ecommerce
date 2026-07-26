'use server'

import { randomUUID } from 'crypto'
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
  updateSellerShopBanner,
  updateSellerShopLogo,
  updateSellerShopProfile,
  type SellerShop,
  type ShopProductSort,
} from '@/lib/db/seller-shop'
import { getProductsByIds } from '@/lib/actions/product.actions'
import type { StoreProduct } from '@/lib/catalog/store-product'
import {
  deleteManagedProductImage,
  deleteOrphanedProductImages,
  storeProductImage,
} from '@/lib/storage/product-images'

const MAX_BANNER_BYTES = 5 * 1024 * 1024
const BANNER_ALLOWED: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
}

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

function revalidateShopPaths(shop: SellerShop) {
  revalidatePath(shopHref(shop))
  revalidatePath(`/shop/${shop.accountId}`)
  revalidatePath('/seller')
}

/** Upload/replace the seller shop cover banner. */
export async function replaceMyShopBanner(
  formData: FormData,
  previousUrl?: string | null
): Promise<{ success: true; url: string } | { success: false; message: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id || !hasSellerAccess(session.user.role)) {
      return { success: false, message: 'Seller access required' }
    }

    const file = formData.get('file')
    if (!file || !(file instanceof File)) {
      return { success: false, message: 'Image file required' }
    }
    if (!BANNER_ALLOWED[file.type]) {
      return { success: false, message: 'Use JPEG, PNG, WebP, or GIF' }
    }
    if (file.size <= 0 || file.size > MAX_BANNER_BYTES) {
      return { success: false, message: 'Image must be between 1 byte and 5MB' }
    }

    const ext = BANNER_ALLOWED[file.type]
    const filename = `${randomUUID()}${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())
    const stored = await storeProductImage({
      buffer,
      filename,
      contentType: file.type,
    })

    const shop = await updateSellerShopBanner(session.user.id, stored.url)
    if (!shop) {
      await deleteManagedProductImage(stored.url)
      return { success: false, message: 'Shop profile not found' }
    }

    await deleteOrphanedProductImages([previousUrl], [stored.url])
    revalidateShopPaths(shop)
    return { success: true, url: stored.url }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

/** Clear the seller shop cover banner. */
export async function removeMyShopBanner(
  previousUrl?: string | null
): Promise<{ success: true } | { success: false; message: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id || !hasSellerAccess(session.user.role)) {
      return { success: false, message: 'Seller access required' }
    }

    const shop = await updateSellerShopBanner(session.user.id, null)
    if (!shop) {
      return { success: false, message: 'Shop profile not found' }
    }

    await deleteOrphanedProductImages([previousUrl], [])
    revalidateShopPaths(shop)
    return { success: true }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

/** Upload/replace the seller shop logo/avatar. */
export async function replaceMyShopLogo(
  formData: FormData,
  previousUrl?: string | null
): Promise<{ success: true; url: string } | { success: false; message: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id || !hasSellerAccess(session.user.role)) {
      return { success: false, message: 'Seller access required' }
    }

    const file = formData.get('file')
    if (!file || !(file instanceof File)) {
      return { success: false, message: 'Image file required' }
    }
    if (!BANNER_ALLOWED[file.type]) {
      return { success: false, message: 'Use JPEG, PNG, WebP, or GIF' }
    }
    if (file.size <= 0 || file.size > MAX_BANNER_BYTES) {
      return { success: false, message: 'Image must be between 1 byte and 5MB' }
    }

    const ext = BANNER_ALLOWED[file.type]
    const filename = `${randomUUID()}${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())
    const stored = await storeProductImage({
      buffer,
      filename,
      contentType: file.type,
    })

    const shop = await updateSellerShopLogo(session.user.id, stored.url)
    if (!shop) {
      await deleteManagedProductImage(stored.url)
      return { success: false, message: 'Shop profile not found' }
    }

    await deleteOrphanedProductImages([previousUrl], [stored.url])
    revalidateShopPaths(shop)
    return { success: true, url: stored.url }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

/** Clear the seller shop logo/avatar. */
export async function removeMyShopLogo(
  previousUrl?: string | null
): Promise<{ success: true } | { success: false; message: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id || !hasSellerAccess(session.user.role)) {
      return { success: false, message: 'Seller access required' }
    }

    const shop = await updateSellerShopLogo(session.user.id, null)
    if (!shop) {
      return { success: false, message: 'Shop profile not found' }
    }

    await deleteOrphanedProductImages([previousUrl], [])
    revalidateShopPaths(shop)
    return { success: true }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}
