import { NextRequest, NextResponse } from 'next/server'
import Product from '@/lib/db/models/product.model'
import { connectToDatabase } from '@/lib/db'
import { apiRateLimiter, getClientIdentifier } from '@/lib/rate-limit'
import { verifyCSRFToken } from '@/lib/csrf'

// Validate MongoDB ObjectId format
const isValidObjectId = (id: string) => {
  return /^[0-9a-fA-F]{24}$/.test(id)
}

// Validate category names (alphanumeric and spaces only)
const isValidCategory = (category: string) => {
  return /^[a-zA-Z0-9\s]+$/.test(category) && category.length <= 50
}

export const GET = async (req: NextRequest) => {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(req)
    if (apiRateLimiter.isRateLimited(clientId)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': apiRateLimiter.getRemainingRequests(clientId).toString(),
            'X-RateLimit-Reset': apiRateLimiter.getResetTime(clientId).toString(),
          }
        }
      )
    }

    const listType = req.nextUrl.searchParams.get('type') || 'history'
    const categoriesParam = req.nextUrl.searchParams.get('categories')
    const productIdsParam = req.nextUrl.searchParams.get('ids')

    // Validate listType
    if (!['history', 'related'].includes(listType)) {
      return NextResponse.json({ error: 'Invalid list type' }, { status: 400 })
    }

    if (!productIdsParam || !categoriesParam) {
      return NextResponse.json([])
    }

    // Validate and sanitize product IDs
    const productIds = productIdsParam.split(',').filter(id => {
      const trimmed = id.trim()
      return trimmed && isValidObjectId(trimmed)
    })

    if (productIds.length === 0) {
      return NextResponse.json({ error: 'No valid product IDs provided' }, { status: 400 })
    }

    // Validate and sanitize categories
    const categories = categoriesParam.split(',').filter(category => {
      const trimmed = category.trim()
      return trimmed && isValidCategory(trimmed)
    })

    if (categories.length === 0) {
      return NextResponse.json({ error: 'No valid categories provided' }, { status: 400 })
    }

    const filter =
      listType === 'history'
        ? {
            _id: { $in: productIds },
          }
        : { category: { $in: categories }, _id: { $nin: productIds } }

    await connectToDatabase()
    const products = await Product.find(filter).limit(20) // Add limit for security

    if (listType === 'history') {
      return NextResponse.json(
        products.sort(
          (a, b) =>
            productIds.indexOf(a._id.toString()) -
            productIds.indexOf(b._id.toString())
        )
      )
    }
    
    return NextResponse.json(products)
  } catch (error) {
    console.error('Browsing history API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const POST = async (req: NextRequest) => {
  try {
    // CSRF protection for POST requests
    const isValid = await verifyCSRFToken(req)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      )
    }

    // Rate limiting
    const clientId = getClientIdentifier(req)
    if (apiRateLimiter.isRateLimited(clientId)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const { productId, action } = body

    // Validate product ID
    if (!productId || !isValidObjectId(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
    }

    // Validate action
    if (!['add', 'remove'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    await connectToDatabase()
    const product = await Product.findById(productId)
    
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Product ${action === 'add' ? 'added to' : 'removed from'} browsing history` 
    })
  } catch (error) {
    console.error('Browsing history POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
