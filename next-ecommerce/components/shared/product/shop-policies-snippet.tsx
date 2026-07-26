import Link from 'next/link'

function truncatePolicy(text: string, max = 140): string {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (cleaned.length <= max) return cleaned
  return `${cleaned.slice(0, max - 1).trimEnd()}…`
}

export default function ShopPoliciesSnippet({
  shopName,
  shopHref,
  shippingPolicy,
  returnsPolicy,
}: {
  shopName: string
  shopHref: string
  shippingPolicy: string | null
  returnsPolicy: string | null
}) {
  if (!shippingPolicy && !returnsPolicy) return null

  return (
    <div className='brick space-y-3 p-4 md:p-5'>
      <p className='brick-label'>Shop policies</p>
      <p className='text-sm text-slate-500'>
        From{' '}
        <Link href={shopHref} className='font-medium text-chrome hover:underline'>
          {shopName}
        </Link>
      </p>
      <div className='space-y-3 text-sm leading-relaxed text-slate-600'>
        {shippingPolicy ? (
          <div>
            <p className='font-medium text-chrome'>Shipping</p>
            <p className='mt-1'>{truncatePolicy(shippingPolicy)}</p>
          </div>
        ) : null}
        {returnsPolicy ? (
          <div>
            <p className='font-medium text-chrome'>Returns</p>
            <p className='mt-1'>{truncatePolicy(returnsPolicy)}</p>
          </div>
        ) : null}
      </div>
      <Link
        href={`${shopHref}#shop-policies`}
        className='inline-block text-sm font-medium text-primary underline hover:text-chrome'
      >
        View full shop policies
      </Link>
    </div>
  )
}
