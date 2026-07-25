import { findUserById, type DbUser } from '@/lib/db/users'
import {
  fetchProductsByIds,
  fetchStoreOrderAsAdmin,
} from '@/lib/catalog/client'

/** Buyer + product-scoped sellers on an order, optionally excluding one account. */
export async function resolveOrderPartyAccounts(input: {
  orderId: string
  authorUserId?: string | null
}): Promise<DbUser[]> {
  const storeOrder = await fetchStoreOrderAsAdmin(input.orderId)
  if (!storeOrder) return []

  const ids = new Set<string>()
  if (storeOrder.userId) ids.add(storeOrder.userId)

  const productIds = [
    ...new Set(
      (storeOrder.items || [])
        .map((item) => item.productId)
        .filter((id): id is string => Boolean(id))
    ),
  ]
  if (productIds.length) {
    const products = await fetchProductsByIds(productIds)
    for (const product of products) {
      if (product.sellerAccountId) ids.add(product.sellerAccountId)
    }
  }
  if (input.authorUserId) ids.delete(input.authorUserId)

  const accounts: DbUser[] = []
  for (const id of ids) {
    const account = await findUserById(id)
    if (account) accounts.push(account)
  }
  return accounts
}
