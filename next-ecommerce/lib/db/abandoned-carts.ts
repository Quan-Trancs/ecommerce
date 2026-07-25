import { query } from '@/lib/db/postgres'

export type AbandonedCartItem = {
  name: string
  slug: string
  image: string
  price: number
  quantity: number
  color: string | null
  size: string | null
}

export type AbandonedCartCandidate = {
  cartId: string
  userId: string
  email: string
  displayName: string | null
  updatedAt: string
  items: AbandonedCartItem[]
  itemsTotal: number
}

type CartHead = {
  cart_id: string
  user_id: string
  email: string
  display_name: string | null
  updated_at: Date | string
}

type ItemRow = {
  cart_id: string
  name: string
  slug: string
  image: string
  price: number | string
  quantity: number
  color: string | null
  size: string | null
}

/**
 * Signed-in carts with items, stale for `staleHours`, not yet emailed for this
 * abandonment episode (last_abandoned_email_at is null or before updated_at).
 */
export async function findAbandonedCartCandidates(options?: {
  staleHours?: number
  limit?: number
}): Promise<AbandonedCartCandidate[]> {
  const staleHours = Math.max(1, options?.staleHours ?? 24)
  const limit = Math.max(1, Math.min(options?.limit ?? 50, 200))

  const heads = await query<CartHead>(
    `SELECT c.id AS cart_id,
            c.user_id,
            a.email,
            a.display_name,
            c.updated_at
     FROM carts c
     JOIN accounts a ON a.id = c.user_id
     WHERE COALESCE(a.active, TRUE) = TRUE
       AND COALESCE(a.notify_abandoned_cart, TRUE) = TRUE
       AND a.email IS NOT NULL
       AND TRIM(a.email) <> ''
       AND c.updated_at IS NOT NULL
       AND c.updated_at < NOW() - ($1::text || ' hours')::interval
       AND (
         c.last_abandoned_email_at IS NULL
         OR c.last_abandoned_email_at < c.updated_at
       )
       AND EXISTS (
         SELECT 1 FROM cart_items i WHERE i.cart_id = c.id AND i.quantity > 0
       )
     ORDER BY c.updated_at ASC
     LIMIT $2`,
    [String(staleHours), limit]
  )

  if (heads.rows.length === 0) return []

  const cartIds = heads.rows.map((row) => row.cart_id)
  const items = await query<ItemRow>(
    `SELECT cart_id, name, slug, image, price, quantity, color, size
     FROM cart_items
     WHERE cart_id = ANY($1::varchar[])
       AND quantity > 0
     ORDER BY name ASC`,
    [cartIds]
  )

  const byCart = new Map<string, AbandonedCartItem[]>()
  for (const row of items.rows) {
    const list = byCart.get(row.cart_id) || []
    list.push({
      name: row.name,
      slug: row.slug,
      image: row.image,
      price: Number(row.price) || 0,
      quantity: Number(row.quantity) || 0,
      color: row.color,
      size: row.size,
    })
    byCart.set(row.cart_id, list)
  }

  return heads.rows
    .map((head) => {
      const cartItems = byCart.get(head.cart_id) || []
      if (cartItems.length === 0) return null
      const itemsTotal = cartItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      )
      return {
        cartId: head.cart_id,
        userId: head.user_id,
        email: head.email,
        displayName: head.display_name,
        updatedAt: new Date(head.updated_at).toISOString(),
        items: cartItems,
        itemsTotal: Math.round((itemsTotal + Number.EPSILON) * 100) / 100,
      } satisfies AbandonedCartCandidate
    })
    .filter((row): row is AbandonedCartCandidate => Boolean(row))
}

export async function markAbandonedCartEmailed(cartId: string): Promise<void> {
  await query(
    `UPDATE carts
     SET last_abandoned_email_at = NOW()
     WHERE id = $1`,
    [cartId]
  )
}
