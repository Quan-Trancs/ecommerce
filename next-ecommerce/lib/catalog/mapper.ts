import type { StoreProduct, StoreProductVariant } from './store-product'
import type { CatalogProduct } from './types'

function roundMoney(value: number | undefined | null, fallback = 0): number {
  const amount = Number(value ?? fallback)
  if (Number.isNaN(amount)) return fallback
  return Math.round((amount + Number.EPSILON) * 100) / 100
}

export function catalogProductToStoreProduct(
  product: CatalogProduct
): StoreProduct {
  const listPrice = roundMoney(product.listPrice, roundMoney(product.price))
  const price = roundMoney(product.price, listPrice)
  const colors = product.attributes?.color || []
  const sizes = product.attributes?.size || []
  const category =
    product.categories?.[0]?.name ||
    product.categories?.[0]?.slug ||
    'General'

  const variants: StoreProductVariant[] | undefined = product.variants?.map(
    (v) => ({
      id: v.id,
      sku: v.sku,
      color: v.color,
      size: v.size,
      price: roundMoney(v.price, price),
      listPrice: roundMoney(v.listPrice, listPrice),
      stockQuantity: Math.max(0, v.stockQuantity ?? 0),
    })
  )

  return {
    _id: product.id,
    name: product.name,
    slug: product.slug,
    category,
    images:
      product.images?.length
        ? product.images
        : [
            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
          ],
    brand: product.brand?.name || 'Store Brand',
    description: product.description || product.name,
    isPublished: product.isPublished !== false,
    price,
    listPrice: listPrice || price,
    countInStock: Math.max(0, product.stockQuantity ?? 0),
    tags: product.tags?.length ? product.tags : ['new-arrival'],
    sizes,
    colors,
    avgRating: product.avgRating ?? 4.5,
    numReviews: product.numReviews ?? 0,
    ratingDistribution: [
      { rating: 1, count: 0 },
      { rating: 2, count: 0 },
      { rating: 3, count: 0 },
      { rating: 4, count: 0 },
      { rating: 5, count: 0 },
    ],
    reviews: [],
    numSales: product.numSales ?? 0,
    variants,
    createdAt: product.createdAt ? new Date(product.createdAt) : new Date(),
    updatedAt: product.updatedAt ? new Date(product.updatedAt) : new Date(),
  }
}

export function catalogProductsToStoreProducts(
  products: CatalogProduct[]
): StoreProduct[] {
  return products.map(catalogProductToStoreProduct)
}
