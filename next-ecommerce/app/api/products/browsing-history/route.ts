import { NextRequest, NextResponse } from 'next/server'
import { apiRateLimiter, getClientIdentifier } from '@/lib/rate-limit'
import { verifyCSRFToken } from '@/lib/csrf'
import {
  getProductsByCategories,
  getProductsByIds,
} from '@/lib/actions/product.actions'

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
      return NextResponse.json([])
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

    if (listType === 'history') {
      const products = await getProductsByIds(productIds)
      return NextResponse.json(
        products.sort(
          (a, b) =>
            productIds.indexOf(String(a._id)) - productIds.indexOf(String(b._id))
        )
      )
    }

    const related = await getProductsByCategories(categories, productIds, 20)
    return NextResponse.json(related)
  } catch (error) {
    console.error('Browsing history API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const POST = async (req: NextRequest) => {
  try {
    const isValid = await verifyCSRFToken(req)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
    }

    const clientId = getClientIdentifier(req)
    if (apiRateLimiter.isRateLimited(clientId)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const { productId, action } = body

    if (!productId || !isValidProductId(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
    }

    if (!['add', 'remove'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const [product] = await getProductsByIds([productId])
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: `Product ${action === 'add' ? 'added to' : 'removed from'} browsing history`,
    })
  } catch (error) {
    console.error('Browsing history POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
