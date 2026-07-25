import ProductCard from '@/components/shared/product/product-card'
import {
  SearchLayout,
} from '@/components/shared/search/search-filters'
import { searchCatalog, getCategoryTree } from '@/lib/actions/product.actions'
import type { CatalogCategory } from '@/lib/catalog/types'
import { sortProducts, toArray } from '@/lib/search/filter-utils'
import Link from 'next/link'

export const metadata = {
  title: 'Search Products',
}

function findCategoryName(
  nodes: CatalogCategory[],
  slug: string
): string | undefined {
  for (const node of nodes) {
    if (node.slug === slug) return node.name
    if (node.children?.length) {
      const nested = findCategoryName(node.children, slug)
      if (nested) return nested
    }
  }
  return undefined
}

function titleCaseSlug(slug: string) {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

type SearchParams = {
  q?: string
  category?: string
  brand?: string | string[]
  tag?: string | string[]
  price?: string
  color?: string | string[]
  size?: string | string[]
  material?: string | string[]
  connectivity?: string | string[]
  'pet-type'?: string | string[]
  'skin-type'?: string | string[]
  page?: string
  sort?: string
}

export default async function SearchPage(props: {
  searchParams: Promise<SearchParams>
}) {
  const searchParams = await props.searchParams
  const q = searchParams.q
  const category = searchParams.category
  const brand = toArray(searchParams.brand)
  const tag = toArray(searchParams.tag)
  const price = searchParams.price
  const page = Number(searchParams.page || '0')
  const sort = searchParams.sort

  const attributes: Record<string, string[]> = {}
  for (const key of [
    'color',
    'size',
    'material',
    'connectivity',
    'pet-type',
    'skin-type',
  ] as const) {
    const values = toArray(searchParams[key])
    if (values?.length) attributes[key] = values
  }

  const current = {
    q,
    category,
    brand: brand?.[0],
    tag: tag?.[0],
    price,
    color: toArray(searchParams.color)?.[0],
    size: toArray(searchParams.size)?.[0],
    material: toArray(searchParams.material)?.[0],
    connectivity: toArray(searchParams.connectivity)?.[0],
    'pet-type': toArray(searchParams['pet-type'])?.[0],
    'skin-type': toArray(searchParams['skin-type'])?.[0],
    sort,
  }

  const [{ products, total, facets }, categories] = await Promise.all([
    searchCatalog({
      q,
      category,
      brand,
      tag,
      price,
      attributes,
      page,
      size: 24,
    }),
    getCategoryTree(),
  ])

  const sortedProducts = sortProducts(products, sort)

  const heading = q
    ? `Results for “${q}”`
    : category
      ? findCategoryName(categories, category) || titleCaseSlug(category)
      : tag
        ? `Tagged: ${tag.join(', ')}`
        : 'All Products'

  return (
    <SearchLayout
      categories={categories}
      facets={facets}
      current={current}
      total={total}
      heading={heading}
    >
      {sortedProducts.length === 0 ? (
        <div className='border border-dashed border-slate-900/20 bg-white/80 px-6 py-16 text-center'>
          <p className='font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-deal'>
            Empty set
          </p>
          <p className='mt-2 font-display text-lg font-bold text-chrome'>
            No products matched these filters
          </p>
          <p className='mt-1 text-sm text-slate-500'>
            Try clearing filters or browsing another department.
          </p>
          <Link href='/search' className='filter-cta mt-5 inline-flex w-auto px-8'>
            Clear filters
          </Link>
        </div>
      ) : (
        <div className='grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 xl:grid-cols-4'>
          {sortedProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </SearchLayout>
  )
}
