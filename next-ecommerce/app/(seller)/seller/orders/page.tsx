export const metadata = { title: 'Seller orders' }

export default function SellerOrdersPage() {
  return (
    <div className='space-y-3'>
      <h2 className='text-xl font-semibold'>Seller orders</h2>
      <p className='text-sm text-muted-foreground'>
        Structure ready: wire to{' '}
        <code>GET /api/v1/seller/orders</code> for orders that include your
        products.
      </p>
      <div className='rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground'>
        No seller order queue yet — reserved for fulfillment workflows.
      </div>
    </div>
  )
}
