/** Shared CSV helpers for seller product import. */

export const SELLER_PRODUCT_CSV_HEADERS = [
  'name',
  'price',
  'listPrice',
  'stock',
  'category',
  'description',
  'imageUrl',
  'tags',
  'published',
] as const

export type SellerProductCsvHeader = (typeof SELLER_PRODUCT_CSV_HEADERS)[number]

export type SellerProductCsvRow = {
  rowNumber: number
  name: string
  price: number
  listPrice?: number
  stockQuantity: number
  category?: string
  description?: string
  imageUrl?: string
  tags: string[]
  isPublished: boolean
}

export type SellerProductCsvParseError = {
  rowNumber: number
  message: string
}

export type SellerProductCsvParseResult = {
  rows: SellerProductCsvRow[]
  errors: SellerProductCsvParseError[]
}

/** Minimal RFC4180-ish CSV parse (quotes, commas, CRLF). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  const pushField = () => {
    row.push(field)
    field = ''
  }
  const pushRow = () => {
    // skip trailing empty line
    if (row.length === 1 && row[0] === '' && rows.length > 0) {
      row = []
      return
    }
    rows.push(row)
    row = []
  }

  const input = text.replace(/^\uFEFF/, '')
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]
    const next = input[i + 1]
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        field += ch
      }
      continue
    }
    if (ch === '"') {
      inQuotes = true
      continue
    }
    if (ch === ',') {
      pushField()
      continue
    }
    if (ch === '\n') {
      pushField()
      pushRow()
      continue
    }
    if (ch === '\r') {
      continue
    }
    field += ch
  }
  pushField()
  if (row.length > 1 || (row.length === 1 && row[0] !== '')) {
    pushRow()
  }
  return rows
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, '')
}

const HEADER_ALIASES: Record<string, SellerProductCsvHeader> = {
  name: 'name',
  price: 'price',
  listprice: 'listPrice',
  list_price: 'listPrice',
  stock: 'stock',
  stockquantity: 'stock',
  stock_quantity: 'stock',
  category: 'category',
  description: 'description',
  imageurl: 'imageUrl',
  image_url: 'imageUrl',
  image: 'imageUrl',
  tags: 'tags',
  published: 'published',
  ispublished: 'published',
}

function splitTags(raw: string | undefined): string[] {
  if (!raw?.trim()) return []
  return raw
    .split(/[|,]/)
    .map((t) => t.trim())
    .filter(Boolean)
}

function parseMoney(raw: string, field: string, rowNumber: number): number | SellerProductCsvParseError {
  const cleaned = raw.replace(/[$,\s]/g, '')
  if (!cleaned) {
    return { rowNumber, message: `${field} is required` }
  }
  const value = Number(cleaned)
  if (!Number.isFinite(value) || value < 0) {
    return { rowNumber, message: `Invalid ${field}: ${raw}` }
  }
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function parseBool(raw: string | undefined, fallback: boolean) {
  if (raw == null || raw.trim() === '') return fallback
  const v = raw.trim().toLowerCase()
  if (['1', 'true', 'yes', 'y'].includes(v)) return true
  if (['0', 'false', 'no', 'n'].includes(v)) return false
  return fallback
}

export function parseSellerProductCsv(
  text: string,
  options?: { maxRows?: number }
): SellerProductCsvParseResult {
  const maxRows = options?.maxRows ?? 100
  const table = parseCsv(text)
  const errors: SellerProductCsvParseError[] = []
  const rows: SellerProductCsvRow[] = []

  if (table.length === 0) {
    return { rows, errors: [{ rowNumber: 0, message: 'CSV is empty' }] }
  }

  const headerCells = table[0].map(normalizeHeader)
  const index: Partial<Record<SellerProductCsvHeader, number>> = {}
  headerCells.forEach((cell, i) => {
    const key = HEADER_ALIASES[cell]
    if (key) index[key] = i
  })

  if (index.name == null || index.price == null) {
    return {
      rows,
      errors: [
        {
          rowNumber: 1,
          message: 'CSV must include name and price columns',
        },
      ],
    }
  }

  const dataRows = table.slice(1)
  if (dataRows.length > maxRows) {
    errors.push({
      rowNumber: 0,
      message: `Too many rows (${dataRows.length}). Max is ${maxRows}.`,
    })
  }

  dataRows.slice(0, maxRows).forEach((cells, offset) => {
    const rowNumber = offset + 2
    const get = (key: SellerProductCsvHeader) => {
      const i = index[key]
      return i == null ? '' : (cells[i] ?? '').trim()
    }

    const name = get('name')
    if (!name) {
      // allow fully blank trailing rows
      if (cells.every((c) => !c.trim())) return
      errors.push({ rowNumber, message: 'name is required' })
      return
    }

    const priceResult = parseMoney(get('price'), 'price', rowNumber)
    if (typeof priceResult !== 'number') {
      errors.push(priceResult)
      return
    }

    let listPrice: number | undefined
    const listRaw = get('listPrice')
    if (listRaw) {
      const listResult = parseMoney(listRaw, 'listPrice', rowNumber)
      if (typeof listResult !== 'number') {
        errors.push(listResult)
        return
      }
      listPrice = listResult
    }

    let stockQuantity = 0
    const stockRaw = get('stock')
    if (stockRaw) {
      const stock = Number(stockRaw.replace(/[,\s]/g, ''))
      if (!Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock)) {
        errors.push({ rowNumber, message: `Invalid stock: ${stockRaw}` })
        return
      }
      stockQuantity = stock
    }

    rows.push({
      rowNumber,
      name,
      price: priceResult,
      listPrice,
      stockQuantity,
      category: get('category') || undefined,
      description: get('description') || undefined,
      imageUrl: get('imageUrl') || undefined,
      tags: splitTags(get('tags')),
      isPublished: parseBool(get('published'), true),
    })
  })

  return { rows, errors }
}

export function sellerProductCsvTemplate(): string {
  const header = SELLER_PRODUCT_CSV_HEADERS.join(',')
  const sample =
    'Sample Widget,19.99,24.99,10,electronics,"A durable sample product",https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800,new-arrival|featured,true'
  return `${header}\n${sample}\n`
}
