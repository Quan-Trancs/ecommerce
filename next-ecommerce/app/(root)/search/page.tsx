import ProductCard from '@/components/shared/product/product-card'
import { searchCatalog, getCategoryTree } from '@/lib/actions/product.actions'
import type { CatalogCategory, Facet } from '@/lib/catalog/types'
import Link from 'next/link'

export const metadata = {
  title: 'Search Products',
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
}

function toArray(value?: string | string[]) {
  if (!value) return undefined
  return (Array.isArray(value) ? value : value.split(',')).filter(Boolean)
}

function buildHref(
  current: Record<string, string | undefined>,
  patch: Record<string, string | null>
) {
  const params = new URLSearchParams()
  const merged = { ...current, ...patch }
  for (const [key, value] of Object.entries(merged)) {
    if (value == null || value === '' || value === 'all') continue
    params.set(key, value)
  }
  const qs = params.toString()
  return qs ? `/search?${qs}` : '/search'
}

function FacetGroup({
  facet,
  current,
}: {
  facet: Facet
  current: Record<string, string | undefined>
}) {
  return (
    <div className='space-y-2 border-b border-border/70 pb-4'>
      <h3 className='font-display text-sm font-bold tracking-tight'>
        {facet.label}
      </h3>
      <ul className='space-y-1.5 text-sm'>
        {facet.values
          .filter((v) => v.count > 0 || v.selected)
          .slice(0, 12)
          .map((value) => {
            const selected =
              value.selected ||
              current[facet.key]?.toLowerCase() === value.value.toLowerCase()
            const href = buildHref(current, {
              [facet.key]: selected ? null : value.value,
              page: null,
            })
            return (
              <li key={`${facet.key}-${value.value}`}>
                <Link
                  href={href}
                  className={
                    selected
                      ? 'inline-flex items-center gap-2 font-semibold text-foreground'
                      : 'inline-flex items-center gap-2 text-muted-foreground hover:text-foreground'
                  }
                >
                  <span
                    className={`h-3.5 w-3.5 rounded-sm border ${
                      selected
                        ? 'border-amber-500 bg-primary'
                        : 'border-slate-300 bg-white'
                    }`}
                  />
                  <span>
                    {value.label}
                    <span className='ml-1 text-xs text-muted-foreground'>
                      ({value.count})
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
      </ul>
    </div>
  )
}

function CategoryTreeLinks({
  nodes,
  current,
  depth = 0,
}: {
  nodes: CatalogCategory[]
  current: Record<string, string | undefined>
  depth?: number
}) {
  return (
    <ul className='space-y-1 text-sm'>
      {nodes.map((node) => (
        <li key={node.id} style={{ paddingLeft: depth * 12 }}>
          <Link
            href={buildHref(current, {
              category: node.slug,
              page: null,
            })}
            className={
              current.category === node.slug
                ? 'font-semibold text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }
          >
            {node.name}
          </Link>
          {node.children && node.children.length > 0 && (
            <CategoryTreeLinks
              nodes={node.children}
              current={current}
              depth={depth + 1}
            />
          )}
        </li>
      ))}
    </ul>
  )
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

  const current: Record<string, string | undefined> = {
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
  }

  const activeChips = Object.entries(current).filter(
    ([key, value]) => value && key !== 'q' && key !== 'page'
  )

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

  const heading = q
    ? `Results for "${q}"`
    : category
      ? `Category: ${category}`
      : tag
        ? `Tagged: ${tag.join(', ')}`
        : 'All Products'

  return (
    <div className='page-shell grid grid-cols-1 gap-6 p-4 md:grid-cols-5 md:gap-8'>
      <aside className='store-section h-fit space-y-5 md:sticky md:top-28'>
        <div>
          <div className='mb-3 flex items-center justify-between'>
            <h2 className='font-display text-base font-bold'>Filters</h2>
            <Link href='/search' className='text-xs font-semibold text-sky-700'>
              Clear all
            </Link>
          </div>
          <Link
            href={buildHref(current, { category: null })}
            className={!category ? 'text-sm font-semibold' : 'text-sm text-muted-foreground'}
          >
            All categories
          </Link>
          <div className='mt-2'>
            <CategoryTreeLinks nodes={categories} current={current} />
          </div>
        </div>

        {facets
          .filter((facet) => facet.key !== 'category')
          .map((facet) => (
            <FacetGroup key={facet.key} facet={facet} current={current} />
          ))}
      </aside>

      <section className='space-y-4 md:col-span-4'>
        <div className='flex flex-wrap items-end justify-between gap-3'>
          <div>
            <h1 className='font-display text-2xl font-bold tracking-tight'>
              {heading}
            </h1>
            <p className='mt-1 text-sm text-muted-foreground'>
              {total} results
            </p>
          </div>
        </div>

        {activeChips.length > 0 && (
          <div className='flex flex-wrap gap-2'>
            {activeChips.map(([key, value]) => (
              <Link
                key={`${key}-${value}`}
                href={buildHref(current, { [key]: null })}
                className='inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium hover:border-amber-400'
              >
                {key}: {value}
                <span aria-hidden>×</span>
              </Link>
            ))}
          </div>
        )}

        {products.length === 0 ? (
          <div className='store-section text-muted-foreground'>
            No products matched these filters. Try clearing filters or another
            category.
          </div>
        ) : (
          <div className='grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-4'>
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
