'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { hasSellerAccess } from '@/lib/auth/roles'
import { formatError } from '@/lib/utils'
import {
  getSellerShop,
  listSellerShopProductIds,
  updateSellerShopProfile,
  type SellerShop,
} from '@/lib/db/seller-shop'
import { getProductsByIds } from '@/lib/actions/product.actions'
import type { StoreProduct } from '@/lib/catalog/store-product'

export type { SellerShop }

export async function getPublicSellerShop(accountId: string): Promise<{
  shop: SellerShop
  products: StoreProduct[]
} | null> {
  const shop = await getSellerShop(accountId)
  if (!shop) return null
  const ids = await listSellerShopProductIds(accountId, { limit: 48 })
  const products = ids.length ? await getProductsByIds(ids) : []
  // Preserve shop order from id list
  const byId = new Map(products.map((p) => [p._id, p]))
  const ordered = ids
    .map((id) => byId.get(id))
    .filter((p): p is StoreProduct => Boolean(p))
  return { shop, products: ordered }
}

export async function getSellerShopSummary(
  accountId: string | null | undefined
): Promise<SellerShop | null> {
  if (!accountId?.trim()) return null
  return getSellerShop(accountId.trim())
}

export async function updateMySellerShop(input: {
  shopName: string
  bio?: string
}): Promise<{ success: boolean; message: string; shop?: SellerShop }> {
  try {
    const session = await auth()
    if (!session?.user?.id || !hasSellerAccess(session.user.role)) {
      return { success: false, message: 'Seller access required' }
    }
    const shop = await updateSellerShopProfile({
      accountId: session.user.id,
      shopName: input.shopName,
      bio: input.bio,
    })
    if (!shop) {
      return { success: false, message: 'Shop profile not found' }
    }
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
