import { NextRequest, NextResponse } from 'next/server'
import { apiRateLimiter, getClientIdentifier } from '@/lib/rate-limit'
import {
  getProductsByCategories,
  getProductsByIds,
} from '@/lib/actions/product.actions'
import { getSellerShopsForProducts } from '@/lib/actions/shop.actions'

const isValidProductId = (id: string) => /^[A-Za-z0-9_-]{3,80}$/.test(id)

const isValidCategory = (category: string) =>
  /^[a-zA-Z0-9\s\-]+$/.test(category) && category.length <= 50

export const GET = async (req: NextRequest) => {
  try {
    const clientId = getClientIdentifier(req)
    if (apiRateLimiter.isRateLimited(clientId)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': apiRateLimiter
              .getRemainingRequests(clientId)
              .toString(),
            'X-RateLimit-Reset': apiRateLimiter.getResetTime(clientId).toString(),
          },
        }
      )
    }

    const listType = req.nextUrl.searchParams.get('type') || 'history'
    const categoriesParam = req.nextUrl.searchParams.get('categories')
    const productIdsParam = req.nextUrl.searchParams.get('ids')

    if (!['history', 'related'].includes(listType)) {
      return NextResponse.json({ error: 'Invalid list type' }, { status: 400 })
    }

    if (!productIdsParam || !categoriesParam) {
      return NextResponse.json({ products: [], shopsBySellerId: {} })
    }

    const productIds = productIdsParam.split(',').filter((id) => {
      const trimmed = id.trim()
      return trimmed && isValidProductId(trimmed)
    })

    if (productIds.length === 0) {
      return NextResponse.json(
        { error: 'No valid product IDs provided' },
        { status: 400 }
      )
    }

    const categories = categoriesParam.split(',').filter((category) => {
      const trimmed = category.trim()
      return trimmed && isValidCategory(trimmed)
    })

    if (categories.length === 0) {
      return NextResponse.json(
        { error: 'No valid categories provided' },
        { status: 400 }
      )
    }

    const products =
      listType === 'history'
        ? (
            await getProductsByIds(productIds)
          ).sort(
            (a, b) =>
              productIds.indexOf(String(a._id)) -
              productIds.indexOf(String(b._id))
          )
        : await getProductsByCategories(categories, productIds, 20)

    const shopsBySellerId = await getSellerShopsForProducts(products)
    return NextResponse.json({ products, shopsBySellerId })
  } catch (error) {
    console.error('Browsing history API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
