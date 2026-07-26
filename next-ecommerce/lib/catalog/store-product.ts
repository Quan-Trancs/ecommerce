/** Canonical storefront product shape (mapped from catalog API). */
export type StoreProductVariant = {
  id: number | string
  sku?: string
  color?: string
  size?: string
  price: number
  listPrice?: number
  stockQuantity: number
}

export type StoreProduct = {
  _id: string
  name: string
  slug: string
  category: string
  images: string[]
  brand: string
  description: string
  isPublished: boolean
  price: number
  listPrice: number
  countInStock: number
  tags: string[]
  sizes: string[]
  colors: string[]
  attributes?: Record<string, string[]>
  avgRating: number
  numReviews: number
  ratingDistribution: { rating: number; count: number }[]
  reviews: unknown[]
  numSales: number
  variants?: StoreProductVariant[]
  /** Owning seller account when sold by a marketplace seller. */
  sellerAccountId?: string | null
  createdAt: Date
  updatedAt: Date
}

/** @deprecated Prefer StoreProduct — alias kept for existing UI imports */
export type IProduct = StoreProduct
