import { checkCatalogHealth } from '@/lib/catalog/client'
import Link from 'next/link'

export default async function CatalogStatusBanner() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_CATALOG_FALLBACK !== 'true') {
    const healthy = await checkCatalogHealth()
    if (!healthy) {
      return (
        <div className='bg-deal px-4 py-2 text-center text-sm font-semibold text-white'>
          Catalog service is unavailable. Shopping is temporarily limited.{' '}
          <Link href='/search' className='underline'>
            Retry
          </Link>
        </div>
      )
    }
    return null
  }

  const healthy = await checkCatalogHealth()
  if (healthy) return null

  return (
    <div className='bg-amber-400 px-4 py-2 text-center text-xs font-bold uppercase tracking-wider text-chrome'>
      Demo mode — catalog API offline; showing fallback products
    </div>
  )
}
