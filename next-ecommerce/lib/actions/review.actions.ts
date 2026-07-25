'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import {
  deleteProductReview,
  findPaidPurchaseForProduct,
  getProductRatingStats,
  getProductReviewByAccount,
  listProductReviews,
  upsertProductReview,
  type ProductReview,
} from '@/lib/db/product-reviews'
import { formatError } from '@/lib/utils'

export type { ProductReview }

export async function getProductReviewsPanel(productId: string): Promise<{
  reviews: ProductReview[]
  avgRating: number
  numReviews: number
  ratingDistribution: { rating: number; count: number }[]
  canReview: boolean
  myReview: ProductReview | null
}> {
  const session = await auth()
  const accountId = session?.user?.id || null
  const [reviews, stats, myReview, purchase] = await Promise.all([
    listProductReviews(productId, { limit: 40 }),
    getProductRatingStats(productId),
    accountId ? getProductReviewByAccount(productId, accountId) : null,
    accountId ? findPaidPurchaseForProduct(accountId, productId) : null,
  ])
  return JSON.parse(
    JSON.stringify({
      reviews,
      avgRating: stats.avgRating,
      numReviews: stats.numReviews,
      ratingDistribution: stats.ratingDistribution,
      canReview: Boolean(purchase),
      myReview,
    })
  )
}

export async function submitProductReview(input: {
  productId: string
  productSlug: string
  rating: number
  title?: string
  body: string
}): Promise<{ success: boolean; message: string; review?: ProductReview }> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: 'Sign in required' }
    }
    const productId = input.productId?.trim()
    if (!productId) return { success: false, message: 'Product required' }

    const purchase = await findPaidPurchaseForProduct(
      session.user.id,
      productId
    )
    if (!purchase) {
      return {
        success: false,
        message: 'Only customers who purchased this product can leave a review',
      }
    }

    const rating = Number(input.rating)
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return { success: false, message: 'Choose a rating from 1 to 5' }
    }
    const body = (input.body || '').trim()
    if (body.length < 10) {
      return { success: false, message: 'Review must be at least 10 characters' }
    }
    if (body.length > 4000) {
      return { success: false, message: 'Review is too long' }
    }

    const review = await upsertProductReview({
      productId,
      accountId: session.user.id,
      orderId: purchase.orderId,
      rating,
      title: input.title,
      body,
    })

    revalidatePath(`/product/${input.productSlug}`)
    revalidatePath('/search')
    return {
      success: true,
      message: 'Review saved',
      review: JSON.parse(JSON.stringify(review)),
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

export async function removeMyProductReview(input: {
  productId: string
  productSlug: string
}): Promise<{ success: boolean; message: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: 'Sign in required' }
    }
    const deleted = await deleteProductReview(
      input.productId,
      session.user.id
    )
    revalidatePath(`/product/${input.productSlug}`)
    revalidatePath('/search')
    return {
      success: true,
      message: deleted ? 'Review removed' : 'No review to remove',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}
