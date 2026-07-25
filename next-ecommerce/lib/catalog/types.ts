export type CatalogBrand = {
  id: number
  name: string
  slug: string
}

export type CatalogCategorySummary = {
  id: string
  name: string
  slug: string
}

export type CatalogProduct = {
  id: string
  name: string
  slug: string
  sku?: string
  description?: string
  price: number
  listPrice?: number
  discountPercentage?: number
  stockQuantity?: number
  brand?: CatalogBrand
  categories?: CatalogCategorySummary[]
  images?: string[]
  tags?: string[]
  attributes?: Record<string, string[]>
  variants?: {
    id: number | string
    sku?: string
    color?: string
    size?: string
    price: number
    listPrice?: number
    stockQuantity?: number
  }[]
  avgRating?: number
  numReviews?: number
  numSales?: number
  isPublished?: boolean
  sellerAccountId?: string | null
  createdAt?: string
  updatedAt?: string
}

export type CatalogCategory = {
  id: string
  name: string
  slug: string
  description?: string
  parentId?: string | null
  imageUrl?: string
  sortOrder?: number
  isActive?: boolean
  children?: CatalogCategory[]
}

export type FacetValue = {
  value: string
  label: string
  count: number
  selected?: boolean
  min?: number
  max?: number
}

export type Facet = {
  key: string
  label: string
  type: 'CATEGORY' | 'BRAND' | 'PRICE' | 'ATTRIBUTE' | string
  values: FacetValue[]
}

export type ProductSearchResult = {
  data: CatalogProduct[]
  total: number
  page: number
  size: number
  facets: Facet[]
}

export type ProductSearchParams = {
  q?: string
  category?: string
  brand?: string[]
  tag?: string[]
  minPrice?: number
  maxPrice?: number
  price?: string
  page?: number
  size?: number
  sort?: string
  /** Dynamic attribute filters, e.g. { color: ['Black'], size: ['M'] } */
  attributes?: Record<string, string[]>
}
