import { query } from '@/lib/db/postgres'
import { roundToTwoDecimals } from '@/lib/utils'

export type AdminDashboardKpis = {
  generatedAt: string
  orders: {
    today: number
    last7Days: number
    pending: number
    paid: number
    shipped: number
    cancelled: number
  }
  revenue: {
    paidLast7Days: number
    paidAllTime: number
  }
  refunds: {
    countLast7Days: number
    amountLast7Days: number
  }
  support: {
    awaitingStaff: number
    unassigned: number
    assignedOpen: number
  }
  accounts: {
    buyers: number
    sellers: number
    support: number
    admins: number
  }
  catalog: {
    published: number
    lowStock: number
  }
  coupons: {
    redemptionsLast7Days: number
  }
}

function num(v: unknown): number {
  return Number(v) || 0
}

export async function getAdminDashboardKpis(): Promise<AdminDashboardKpis> {
  const [
    ordersResult,
    revenueResult,
    refundsResult,
    supportResult,
    accountsResult,
    catalogResult,
    couponsResult,
  ] = await Promise.all([
    query<{
      today: number | string
      last7: number | string
      pending: number | string
      paid: number | string
      shipped: number | string
      cancelled: number | string
    }>(
      `SELECT
         COUNT(*) FILTER (WHERE created_at >= date_trunc('day', NOW()))::int AS today,
         COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::int AS last7,
         COUNT(*) FILTER (
           WHERE UPPER(COALESCE(status, '')) = 'PENDING'
         )::int AS pending,
         COUNT(*) FILTER (
           WHERE UPPER(COALESCE(status, '')) = 'PAID'
              OR (is_paid = TRUE AND UPPER(COALESCE(status, '')) NOT IN ('SHIPPED', 'CANCELLED'))
         )::int AS paid,
         COUNT(*) FILTER (
           WHERE UPPER(COALESCE(status, '')) = 'SHIPPED'
         )::int AS shipped,
         COUNT(*) FILTER (
           WHERE UPPER(COALESCE(status, '')) = 'CANCELLED'
         )::int AS cancelled
       FROM store_orders`
    ),
    query<{ last7: number | string | null; all_time: number | string | null }>(
      `SELECT
         COALESCE(SUM(total_price) FILTER (
           WHERE is_paid = TRUE
             AND UPPER(COALESCE(status, '')) <> 'CANCELLED'
             AND COALESCE(paid_at, created_at) >= NOW() - INTERVAL '7 days'
         ), 0) AS last7,
         COALESCE(SUM(total_price) FILTER (
           WHERE is_paid = TRUE
             AND UPPER(COALESCE(status, '')) <> 'CANCELLED'
         ), 0) AS all_time
       FROM store_orders`
    ),
    query<{ count: number | string; amount: number | string | null }>(
      `SELECT COUNT(*)::int AS count,
              COALESCE(SUM(amount), 0) AS amount
       FROM order_refunds
       WHERE created_at >= NOW() - INTERVAL '7 days'`
    ),
    query<{
      awaiting: number | string
      unassigned: number | string
      assigned_open: number | string
    }>(
      `WITH public_notes AS (
         SELECT n.*
         FROM store_order_notes n
         WHERE UPPER(COALESCE(n.visibility, 'PUBLIC')) = 'PUBLIC'
       ),
       latest AS (
         SELECT DISTINCT ON (order_id)
                order_id,
                author_role AS last_author_role
         FROM public_notes
         ORDER BY order_id, created_at DESC
       ),
       tickets AS (
         SELECT l.order_id,
                (
                  UPPER(COALESCE(l.last_author_role, '')) NOT IN ('SUPPORT', 'ADMIN')
                ) AS awaiting_staff,
                asg.assignee_id
         FROM latest l
         LEFT JOIN support_ticket_assignments asg ON asg.order_id = l.order_id
       )
       SELECT
         COUNT(*) FILTER (WHERE awaiting_staff)::int AS awaiting,
         COUNT(*) FILTER (WHERE assignee_id IS NULL)::int AS unassigned,
         COUNT(*) FILTER (
           WHERE assignee_id IS NOT NULL AND awaiting_staff
         )::int AS assigned_open
       FROM tickets`
    ),
    query<{
      buyers: number | string
      sellers: number | string
      support: number | string
      admins: number | string
    }>(
      `SELECT
         COUNT(*) FILTER (WHERE UPPER(COALESCE(role, '')) = 'BUYER')::int AS buyers,
         COUNT(*) FILTER (WHERE UPPER(COALESCE(role, '')) = 'SELLER')::int AS sellers,
         COUNT(*) FILTER (WHERE UPPER(COALESCE(role, '')) = 'SUPPORT')::int AS support,
         COUNT(*) FILTER (WHERE UPPER(COALESCE(role, '')) = 'ADMIN')::int AS admins
       FROM accounts
       WHERE COALESCE(active, TRUE) = TRUE`
    ),
    query<{ published: number | string; low_stock: number | string }>(
      `SELECT
         COUNT(*) FILTER (
           WHERE COALESCE(is_published, TRUE) = TRUE
         )::int AS published,
         COUNT(*) FILTER (
           WHERE COALESCE(is_published, TRUE) = TRUE
             AND COALESCE(stock_quantity, 0) <= 5
         )::int AS low_stock
       FROM products`
    ),
    query<{ count: number | string }>(
      `SELECT COUNT(*)::int AS count
       FROM coupon_redemptions
       WHERE created_at >= NOW() - INTERVAL '7 days'`
    ),
  ])

  const orders = ordersResult.rows[0]
  const revenue = revenueResult.rows[0]
  const refunds = refundsResult.rows[0]
  const support = supportResult.rows[0]
  const accounts = accountsResult.rows[0]
  const catalog = catalogResult.rows[0]
  const coupons = couponsResult.rows[0]

  return {
    generatedAt: new Date().toISOString(),
    orders: {
      today: num(orders?.today),
      last7Days: num(orders?.last7),
      pending: num(orders?.pending),
      paid: num(orders?.paid),
      shipped: num(orders?.shipped),
      cancelled: num(orders?.cancelled),
    },
    revenue: {
      paidLast7Days: roundToTwoDecimals(num(revenue?.last7)),
      paidAllTime: roundToTwoDecimals(num(revenue?.all_time)),
    },
    refunds: {
      countLast7Days: num(refunds?.count),
      amountLast7Days: roundToTwoDecimals(num(refunds?.amount)),
    },
    support: {
      awaitingStaff: num(support?.awaiting),
      unassigned: num(support?.unassigned),
      assignedOpen: num(support?.assigned_open),
    },
    accounts: {
      buyers: num(accounts?.buyers),
      sellers: num(accounts?.sellers),
      support: num(accounts?.support),
      admins: num(accounts?.admins),
    },
    catalog: {
      published: num(catalog?.published),
      lowStock: num(catalog?.low_stock),
    },
    coupons: {
      redemptionsLast7Days: num(coupons?.count),
    },
  }
}
