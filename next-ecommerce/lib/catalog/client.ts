import { FALLBACK_CATEGORIES, FALLBACK_SEARCH } from './fallback-data'
import type {
  CatalogCategory,
  CatalogProduct,
  ProductSearchParams,
  ProductSearchResult,
} from './types'

const DEFAULT_API_URL = 'http://localhost:8082/api'

export function getCatalogApiUrl() {
  return (
    process.env.CATALOG_API_URL?.replace(/\/$/, '') ||
    process.env.STORE_API_URL?.replace(/\/$/, '') ||
    DEFAULT_API_URL
  )
}

async function catalogFetch<T>(path: string): Promise<T> {
  const url = `${getCatalogApiUrl()}${path.startsWith('/') ? path : `/${path}`}`
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error(`Catalog API ${response.status}: ${response.statusText} (${url})`)
  }
  return (await response.json()) as T
}

function buildSearchQuery(params: ProductSearchParams): string {
  const query = new URLSearchParams()
  if (params.q) query.set('q', params.q)
  if (params.category && params.category.toLowerCase() !== 'all') {
    query.set('category', params.category)
  }
  params.brand?.forEach((brand) => query.append('brand', brand))
  params.tag?.forEach((tag) => query.append('tag', tag))
  if (params.minPrice != null) query.set('minPrice', String(params.minPrice))
  if (params.maxPrice != null) query.set('maxPrice', String(params.maxPrice))
  if (params.price) query.set('price', params.price)
  query.set('page', String(params.page ?? 0))
  query.set('size', String(params.size ?? 20))
  if (params.attributes) {
    for (const [key, values] of Object.entries(params.attributes)) {
      if (values?.length) query.set(key, values.join(','))
    }
  }
  return query.toString()
}

export async function searchProducts(
  params: ProductSearchParams = {}
): Promise<ProductSearchResult> {
  try {
    return await catalogFetch<ProductSearchResult>(
      `/v1/products?${buildSearchQuery(params)}`
    )
  } catch (error) {
    console.warn('Catalog API unavailable, using fallback products:', error)
    return filterFallback(params)
  }
}

export async function fetchProductByIdOrSlug(
  idOrSlug: string
): Promise<CatalogProduct | null> {
  try {
    const response = await fetch(
      `${getCatalogApiUrl()}/v1/products/${encodeURIComponent(idOrSlug)}`,
      { headers: { Accept: 'application/json' }, cache: 'no-store' }
    )
    if (response.status === 404) return null
    if (!response.ok) {
      throw new Error(`Catalog API ${response.status}`)
    }
    return (await response.json()) as CatalogProduct
  } catch (error) {
    console.warn('Catalog API unavailable, using fallback product:', error)
    return (
      FALLBACK_SEARCH.data.find(
        (product) =>
          product.id.toLowerCase() === idOrSlug.toLowerCase() ||
          product.slug.toLowerCase() === idOrSlug.toLowerCase()
      ) || null
    )
  }
}

export async function fetchCategories(): Promise<CatalogCategory[]> {
  try {
    return await catalogFetch<CatalogCategory[]>('/v1/categories?view=tree')
  } catch (error) {
    console.warn('Catalog API unavailable, using fallback categories:', error)
    return FALLBACK_CATEGORIES
  }
}

export async function fetchFlatCategories(): Promise<CatalogCategory[]> {
  try {
    return await catalogFetch<CatalogCategory[]>('/v1/categories?view=flat')
  } catch {
    const flat: CatalogCategory[] = []
    const walk = (nodes: CatalogCategory[]) => {
      for (const node of nodes) {
        flat.push({ ...node, children: [] })
        if (node.children?.length) walk(node.children)
      }
    }
    walk(FALLBACK_CATEGORIES)
    return flat
  }
}

function filterFallback(params: ProductSearchParams): ProductSearchResult {
  let products = [...FALLBACK_SEARCH.data]

  if (params.q) {
    const q = params.q.toLowerCase()
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.brand?.name.toLowerCase().includes(q)
    )
  }
  if (params.category && params.category.toLowerCase() !== 'all') {
    const cat = params.category.toLowerCase()
    products = products.filter((p) =>
      p.categories?.some(
        (c) => c.slug.toLowerCase() === cat || c.name.toLowerCase() === cat
      )
    )
  }
  if (params.brand?.length) {
    const brands = params.brand.map((b) => b.toLowerCase())
    products = products.filter(
      (p) =>
        p.brand &&
        (brands.includes(p.brand.slug.toLowerCase()) ||
          brands.includes(p.brand.name.toLowerCase()))
    )
  }
  if (params.tag?.length) {
    const tags = params.tag.map((t) => t.toLowerCase())
    products = products.filter((p) =>
      p.tags?.some((tag) => tags.includes(tag.toLowerCase()))
    )
  }
  if (params.attributes) {
    for (const [key, values] of Object.entries(params.attributes)) {
      if (!values?.length) continue
      const wanted = values.map((v) => v.toLowerCase())
      products = products.filter((p) =>
        p.attributes?.[key]?.some((v) => wanted.includes(v.toLowerCase()))
      )
    }
  }

  const page = params.page ?? 0
  const size = params.size ?? 20
  return {
    data: products.slice(page * size, page * size + size),
    total: products.length,
    page,
    size,
    facets: FALLBACK_SEARCH.facets,
  }
}
