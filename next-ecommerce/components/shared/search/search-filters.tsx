'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, ChevronDown, SlidersHorizontal, X } from 'lucide-react'
import type { CatalogCategory, Facet, FacetValue } from '@/lib/catalog/types'
import {
  buildHref,
  chipLabel,
  colorSwatch,
  facetLabel,
  formatPriceRange,
  isLightSwatch,
  type FilterState,
} from '@/lib/search/filter-utils'
import { cn } from '@/lib/utils'

type SearchLayoutProps = {
  categories: CatalogCategory[]
  facets: Facet[]
  current: FilterState
  total: number
  heading: string
  children: React.ReactNode
}

function FacetSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section className='border-b border-slate-900/8 py-3.5 last:border-b-0'>
      <button
        type='button'
        onClick={() => setOpen((v) => !v)}
        className='flex w-full items-center justify-between gap-2 text-left'
        aria-expanded={open}
      >
        <span className='filter-section-title truncate'>{title}</span>
        <span
          className={cn(
            'flex h-5 w-5 items-center justify-center border border-slate-900/15 bg-white text-slate-600 transition-transform duration-200',
            open && 'rotate-180 bg-chrome text-white'
          )}
        >
          <ChevronDown className='h-3.5 w-3.5' strokeWidth={2.5} />
        </span>
      </button>
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-out',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
      >
        <div className='overflow-hidden'>
          <div className='pt-2.5'>{children}</div>
        </div>
      </div>
    </section>
  )
}

function SeeMoreList({
  items,
  limit = 6,
  renderItem,
}: {
  items: FacetValue[]
  limit?: number
  renderItem: (value: FacetValue) => React.ReactNode
}) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? items : items.slice(0, limit)
  const hasMore = items.length > limit

  return (
    <div>
      <ul className='space-y-0.5'>{visible.map((item) => renderItem(item))}</ul>
      {hasMore && (
        <button
          type='button'
          onClick={() => setExpanded((v) => !v)}
          className='mt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-deal hover:text-chrome'
        >
          {expanded ? 'Show less' : `+ ${items.length - limit} more`}
        </button>
      )}
    </div>
  )
}

function CheckboxFacet({
  facet,
  current,
}: {
  facet: Facet
  current: FilterState
}) {
  const values = facet.values.filter((v) => v.count > 0 || v.selected)

  return (
    <SeeMoreList
      items={values}
      renderItem={(value) => {
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
              className='filter-option'
              data-selected={selected || undefined}
            >
              <span
                className='filter-check flex shrink-0 items-center justify-center'
                data-selected={selected || undefined}
              >
                {selected && (
                  <Check className='h-2.5 w-2.5 text-primary' strokeWidth={3} />
                )}
              </span>
              <span className='min-w-0 flex-1 truncate'>{value.label}</span>
              <span className='filter-count'>{value.count}</span>
            </Link>
          </li>
        )
      }}
    />
  )
}

function ColorFacet({
  facet,
  current,
}: {
  facet: Facet
  current: FilterState
}) {
  const values = facet.values.filter((v) => v.count > 0 || v.selected)

  return (
    <div className='flex flex-wrap gap-3 pt-1'>
      {values.map((value) => {
        const selected =
          value.selected ||
          current[facet.key]?.toLowerCase() === value.value.toLowerCase()
        const href = buildHref(current, {
          [facet.key]: selected ? null : value.value,
          page: null,
        })
        const swatch = colorSwatch(value.value)
        const light = isLightSwatch(value.value)
        return (
          <Link
            key={value.value}
            href={href}
            title={`${value.label} (${value.count})`}
            className='group flex w-[3.1rem] flex-col items-center gap-1.5'
          >
            <span
              className='filter-swatch relative flex items-center justify-center'
              data-selected={selected || undefined}
              style={{ background: swatch }}
            >
              {selected && (
                <Check
                  className={cn(
                    'h-3.5 w-3.5',
                    light ? 'text-chrome' : 'text-white'
                  )}
                  strokeWidth={3}
                />
              )}
            </span>
            <span className='w-full truncate text-center font-mono text-[9px] uppercase tracking-wide text-slate-500'>
              {value.label}
            </span>
          </Link>
        )
      })}
    </div>
  )
}

function SizeFacet({
  facet,
  current,
}: {
  facet: Facet
  current: FilterState
}) {
  const values = facet.values.filter((v) => v.count > 0 || v.selected)

  return (
    <div className='flex flex-wrap gap-1.5'>
      {values.map((value) => {
        const selected =
          value.selected ||
          current[facet.key]?.toLowerCase() === value.value.toLowerCase()
        const href = buildHref(current, {
          [facet.key]: selected ? null : value.value,
          page: null,
        })
        return (
          <Link
            key={value.value}
            href={href}
            className='filter-size'
            data-selected={selected || undefined}
          >
            {value.label}
          </Link>
        )
      })}
    </div>
  )
}

function PriceFacet({
  facet,
  current,
}: {
  facet: Facet
  current: FilterState
}) {
  const values = facet.values.filter((v) => v.count > 0 || v.selected)
  const maxCount = Math.max(...values.map((v) => v.count), 1)

  return (
    <ul className='space-y-1'>
      {values.map((value) => {
        const selected = value.selected || current.price === value.value
        const href = buildHref(current, {
          price: selected ? null : value.value,
          page: null,
        })
        const width = Math.max(12, Math.round((value.count / maxCount) * 100))
        return (
          <li key={value.value}>
            <Link
              href={href}
              className='filter-option relative overflow-hidden'
              data-selected={selected || undefined}
            >
              <span
                aria-hidden
                className='pointer-events-none absolute inset-y-0 left-0 bg-primary/15'
                style={{ width: `${width}%` }}
              />
              <span className='relative flex-1 font-medium'>
                {formatPriceRange(value.value)}
              </span>
              <span className='filter-count relative'>{value.count}</span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

function categoryInPath(node: CatalogCategory, slug?: string): boolean {
  if (!slug) return false
  if (node.slug === slug) return true
  return Boolean(node.children?.some((child) => categoryInPath(child, slug)))
}

function CategoryTree({
  nodes,
  current,
  depth = 0,
}: {
  nodes: CatalogCategory[]
  current: FilterState
  depth?: number
}) {
  return (
    <ul className={cn(depth === 0 && 'space-y-0.5')}>
      {nodes.map((node) => {
        const selected = current.category === node.slug
        const hasChildren = Boolean(node.children?.length)
        const expanded = selected || categoryInPath(node, current.category)
        return (
          <li key={node.id}>
            <Link
              href={buildHref(current, {
                category: node.slug,
                page: null,
              })}
              className='filter-option'
              data-selected={selected || undefined}
              style={{ paddingLeft: depth * 12 + 4 }}
            >
              {depth > 0 && (
                <span className='mr-1 font-mono text-[10px] text-slate-400'>
                  └
                </span>
              )}
              <span className='truncate'>{node.name}</span>
            </Link>
            {hasChildren && expanded && (
              <CategoryTree
                nodes={node.children!}
                current={current}
                depth={depth + 1}
              />
            )}
          </li>
        )
      })}
    </ul>
  )
}

function FacetBody({
  facet,
  current,
}: {
  facet: Facet
  current: FilterState
}) {
  if (facet.key === 'color') {
    return <ColorFacet facet={facet} current={current} />
  }
  if (facet.key === 'size') {
    return <SizeFacet facet={facet} current={current} />
  }
  if (facet.key === 'price' || facet.type === 'PRICE') {
    return <PriceFacet facet={facet} current={current} />
  }
  return <CheckboxFacet facet={facet} current={current} />
}

function clearFiltersHref(current: FilterState) {
  return buildHref(
    { q: current.q },
    Object.fromEntries(
      Object.keys(current)
        .filter((k) => k !== 'q')
        .map((k) => [k, null])
    )
  )
}

function FilterPanel({
  categories,
  facets,
  current,
}: {
  categories: CatalogCategory[]
  facets: Facet[]
  current: FilterState
}) {
  const nonCategoryFacets = facets.filter((f) => f.key !== 'category')
  const hasActive = Object.entries(current).some(
    ([k, v]) => v && k !== 'q' && k !== 'page' && k !== 'sort'
  )

  return (
    <div className='filter-rail'>
      <div className='mb-2 flex items-center justify-between gap-2 border-b border-dashed border-slate-900/15 pb-2.5'>
        <h2 className='filter-rail-title'>Refine</h2>
        {hasActive && (
          <Link
            href={clearFiltersHref(current)}
            className='font-mono text-[10px] font-bold uppercase tracking-wider text-deal hover:text-chrome'
          >
            Reset
          </Link>
        )}
      </div>

      <FacetSection title='Department' defaultOpen>
        <Link
          href={buildHref(current, { category: null, page: null })}
          className='filter-option'
          data-selected={!current.category || undefined}
        >
          <span className='truncate'>All departments</span>
        </Link>
        <CategoryTree nodes={categories} current={current} />
      </FacetSection>

      {nonCategoryFacets.map((facet, index) => (
        <FacetSection
          key={facet.key}
          title={facet.label || facetLabel(facet.key)}
          defaultOpen={index < 4}
        >
          <FacetBody facet={facet} current={current} />
        </FacetSection>
      ))}
    </div>
  )
}

function ActiveChips({ current }: { current: FilterState }) {
  const chips = Object.entries(current).filter(
    ([key, value]) => value && key !== 'q' && key !== 'page' && key !== 'sort'
  )
  if (chips.length === 0) return null

  return (
    <div className='mb-4 flex flex-wrap items-center gap-2'>
      <span className='font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500'>
        Active
      </span>
      {chips.map(([key, value]) => (
        <Link
          key={`${key}-${value}`}
          href={buildHref(current, { [key]: null, page: null })}
          className='filter-chip'
        >
          <span>{chipLabel(key, value!)}</span>
          <X className='h-3 w-3 opacity-60' />
        </Link>
      ))}
      <Link
        href={clearFiltersHref(current)}
        className='font-mono text-[10px] font-bold uppercase tracking-wider text-deal hover:text-chrome'
      >
        Clear
      </Link>
    </div>
  )
}

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Avg. Customer Review' },
  { value: 'newest', label: 'Newest Arrivals' },
] as const

function SortSelect({
  current,
  className,
}: {
  current: FilterState
  className?: string
}) {
  const router = useRouter()
  const sort = current.sort || 'featured'
  return (
    <label className={cn('relative inline-flex min-w-0', className)}>
      <span className='sr-only'>Sort by</span>
      <select
        className='filter-sort'
        value={sort}
        onChange={(e) => {
          router.push(
            buildHref(current, {
              sort: e.target.value === 'featured' ? null : e.target.value,
              page: null,
            })
          )
        }}
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className='pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-chrome' />
    </label>
  )
}

export function SearchLayout({
  categories,
  facets,
  current,
  total,
  heading,
  children,
}: SearchLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const activeCount = useMemo(
    () =>
      Object.entries(current).filter(
        ([k, v]) => v && k !== 'q' && k !== 'page' && k !== 'sort'
      ).length,
    [current]
  )

  useEffect(() => {
    setMobileOpen(false)
  }, [current])

  useEffect(() => {
    if (!mobileOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileOpen])

  return (
    <div className='search-page'>
      <div className='page-shell flex flex-col gap-0 px-4 py-5 md:px-6 md:py-7 lg:flex-row lg:gap-7'>
        <aside className='hidden w-[232px] shrink-0 lg:block xl:w-[252px]'>
          <div className='sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto overscroll-contain filter-panel-in'>
            <FilterPanel
              categories={categories}
              facets={facets}
              current={current}
            />
          </div>
        </aside>

        <div className='min-w-0 flex-1'>
          <div className='sticky top-[3.25rem] z-30 -mx-4 mb-4 border-y border-slate-900/10 bg-[#eef1f6]/90 px-4 py-2.5 backdrop-blur lg:hidden'>
            <div className='flex items-center gap-2'>
              <button
                type='button'
                onClick={() => setMobileOpen(true)}
                className='filter-toolbar-btn flex-1'
              >
                <SlidersHorizontal className='h-4 w-4' />
                Refine
                {activeCount > 0 && (
                  <span className='bg-primary px-1.5 py-0.5 font-mono text-[10px] font-bold text-chrome'>
                    {activeCount}
                  </span>
                )}
              </button>
              <SortSelect current={current} className='flex-1' />
            </div>
          </div>

          <div className='search-results-banner fade-up'>
            <div className='relative z-10 flex flex-wrap items-end justify-between gap-3 pr-14'>
              <div className='min-w-0'>
                <p className='font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-primary'>
                  Catalog
                </p>
                <h1 className='mt-1 font-display text-xl font-extrabold tracking-tight md:text-2xl'>
                  {heading}
                </h1>
                <p className='mt-1 font-mono text-xs text-white/60'>
                  {total.toLocaleString()} matches
                </p>
              </div>
              <div className='hidden items-center gap-2 lg:flex'>
                <span className='font-mono text-[10px] uppercase tracking-wider text-white/50'>
                  Sort
                </span>
                <SortSelect current={current} className='w-[210px]' />
              </div>
            </div>
          </div>

          <ActiveChips current={current} />

          {children}
        </div>

        {mobileOpen && (
          <div className='fixed inset-0 z-50 lg:hidden' role='dialog' aria-modal>
            <button
              type='button'
              aria-label='Close filters'
              className='absolute inset-0 bg-chrome/50'
              onClick={() => setMobileOpen(false)}
            />
            <div className='filter-drawer absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col filter-panel-in'>
              <div className='flex items-center justify-between border-b border-dashed border-slate-900/15 px-4 py-3'>
                <h2 className='filter-rail-title'>Refine results</h2>
                <button
                  type='button'
                  onClick={() => setMobileOpen(false)}
                  className='border border-slate-900/15 bg-white p-1.5 hover:bg-chrome hover:text-white'
                  aria-label='Close'
                >
                  <X className='h-5 w-5' />
                </button>
              </div>
              <div className='flex-1 overflow-y-auto px-3 py-2'>
                <FilterPanel
                  categories={categories}
                  facets={facets}
                  current={current}
                />
              </div>
              <div className='border-t border-slate-900/10 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]'>
                <button
                  type='button'
                  onClick={() => setMobileOpen(false)}
                  className='filter-cta'
                >
                  Show {total.toLocaleString()} results
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
