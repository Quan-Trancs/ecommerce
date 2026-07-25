export type FilterState = Record<string, string | undefined>

export function toArray(value?: string | string[]) {
  if (!value) return undefined
  return (Array.isArray(value) ? value : value.split(',')).filter(Boolean)
}

export function buildHref(
  current: FilterState,
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

const FACET_LABELS: Record<string, string> = {
  q: 'Search',
  category: 'Category',
  brand: 'Brand',
  tag: 'Tag',
  price: 'Price',
  color: 'Color',
  size: 'Size',
  material: 'Material',
  connectivity: 'Connectivity',
  'pet-type': 'Pet type',
  'skin-type': 'Skin type',
  sort: 'Sort',
}

export function facetLabel(key: string) {
  return FACET_LABELS[key] || key.replace(/-/g, ' ')
}

export function formatPriceRange(value: string) {
  if (value.endsWith('-')) {
    const min = value.slice(0, -1)
    return `$${min} & above`
  }
  if (value.startsWith('-')) {
    return `Under $${value.slice(1)}`
  }
  const [min, max] = value.split('-')
  if (min && max) return `$${min} – $${max}`
  return value
}

export function chipLabel(key: string, value: string) {
  if (key === 'price') return formatPriceRange(value)
  return `${facetLabel(key)}: ${value}`
}

/** Approximate swatch colors for common retail color names */
export function colorSwatch(name: string): string {
  const key = name.trim().toLowerCase()
  const map: Record<string, string> = {
    black: '#111827',
    white: '#f8fafc',
    ivory: '#fffff0',
    cream: '#fffdd0',
    gray: '#9ca3af',
    grey: '#9ca3af',
    silver: '#c0c0c0',
    charcoal: '#374151',
    red: '#dc2626',
    crimson: '#b91c1c',
    pink: '#ec4899',
    rose: '#f43f5e',
    orange: '#f97316',
    yellow: '#eab308',
    gold: '#d4a017',
    green: '#16a34a',
    olive: '#6b8e23',
    teal: '#0d9488',
    blue: '#2563eb',
    navy: '#1e3a8a',
    sky: '#0ea5e9',
    purple: '#7c3aed',
    violet: '#8b5cf6',
    brown: '#92400e',
    tan: '#d2b48c',
    beige: '#d6c6a8',
    khaki: '#c3b091',
    multi: 'linear-gradient(135deg,#ef4444,#eab308,#22c55e,#3b82f6)',
    multicolor: 'linear-gradient(135deg,#ef4444,#eab308,#22c55e,#3b82f6)',
  }
  return map[key] || '#cbd5e1'
}

export function isLightSwatch(name: string) {
  const key = name.trim().toLowerCase()
  return ['white', 'ivory', 'cream', 'yellow', 'beige', 'tan', 'silver'].includes(
    key
  )
}

export function sortProducts<
  T extends {
    price: number
    avgRating: number
    createdAt?: Date | string
  },
>(products: T[], sort?: string): T[] {
  const list = [...products]
  switch (sort) {
    case 'price-asc':
      return list.sort((a, b) => a.price - b.price)
    case 'price-desc':
      return list.sort((a, b) => b.price - a.price)
    case 'rating':
      return list.sort((a, b) => b.avgRating - a.avgRating)
    case 'newest':
      return list.sort((a, b) => {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return db - da
      })
    default:
      return list
  }
}
