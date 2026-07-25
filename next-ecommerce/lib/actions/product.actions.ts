'use server'

import { PAGE_SIZE } from '../constants'
import {
  fetchCategories,
  fetchFlatCategories,
  fetchProductByIdOrSlug,
  fetchProductsByIds,
  searchProducts,
} from '@/lib/catalog/client'
import {
  catalogProductToStoreProduct,
  catalogProductsToStoreProducts,
} from '@/lib/catalog/mapper'
import type { CatalogCategory, Facet, ProductSearchParams } from '@/lib/catalog/types'
import type { StoreProduct } from '@/lib/catalog/store-product'

function flattenCategories(nodes: CatalogCategory[]): CatalogCategory[] {
  const result: CatalogCategory[] = []
  const walk = (list: CatalogCategory[]) => {
    for (const node of list) {
      result.push(node)
      if (node.children?.length) walk(node.children)
    }
  }
  walk(nodes)
  return result
}

export async function getCategoryTree() {
  return fetchCategories()
}

export async function getAllCategories() {
  const flat = await fetchFlatCategories()
  if (flat.length) return flat.map((c) => c.name)

  const tree = await fetchCategories()
  return flattenCategories(tree).map((c) => c.name)
}

export async function searchCatalog(params: ProductSearchParams): Promise<{
  products: StoreProduct[]
  total: number
  facets: Facet[]
  page: number
  size: number
}> {
  const result = await searchProducts(params)
  return {
    products: catalogProductsToStoreProducts(result.data),
    total: result.total,
    facets: result.facets || [],
    page: result.page,
    size: result.size,
  }
}

export async function getProductsForCard({
  tag,
  limit = 4,
}: {
  tag?: string
  limit?: number
}) {
  const products = tag
    ? await getProductsByTag({ tag, limit })
    : (await searchCatalog({ size: limit })).products.slice(0, limit)

  return products.map((product) => ({
    name: product.name,
    href: `/product/${product.slug}`,
    image: product.images[0],
  }))
}

export async function getProductsByTag({
  tag,
  limit = 10,
}: {
  tag: string
  limit?: number
}) {
  const { products } = await searchCatalog({ tag: [tag], size: limit })
  if (products.length) return products.slice(0, limit)

  const fallback = await searchCatalog({ size: Math.max(limit * 2, 20) })
  return fallback.products.slice(0, limit)
}

export async function getProductBySlug(slug: string) {
  const product = await fetchProductByIdOrSlug(slug)
  if (!product) throw new Error('Product not found')
  return catalogProductToStoreProduct(product)
}

export async function getRelatedProductsByCategory({
  category,
  productId,
  limit = PAGE_SIZE,
  page = 1,
}: {
  category: string
  productId: string
  limit?: number
  page?: number
}) {
  const { products, total } = await searchCatalog({
    category,
    page: Math.max(page - 1, 0),
    size: limit + 5,
  })
  const filtered = products.filter((p) => p._id !== productId).slice(0, limit)
  return {
    data: filtered,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  }
}

export async function getProductsByIds(ids: string[]) {
  const catalogProducts = await fetchProductsByIds(ids)
  return catalogProductsToStoreProducts(catalogProducts)
}

export async function getProductsByCategories(
  categories: string[],
  excludeIds: string[] = [],
  limit = 20
) {
  const exclude = new Set(excludeIds.map((id) => id.toUpperCase()))
  const results = await Promise.all(
    categories.map((category) => searchCatalog({ category, size: limit }))
  )
  const merged = results.flatMap((r) => r.products)
  const seen = new Set<string>()
  return merged
    .filter((product) => {
      const id = String(product._id).toUpperCase()
      if (exclude.has(id) || seen.has(id)) return false
      seen.add(id)
      return true
    })
    .slice(0, limit)
}
