export const metadata = { title: 'Seller products' }

export default function SellerProductsPage() {
  return (
    <div className='space-y-3'>
      <h2 className='text-xl font-semibold'>Your products</h2>
      <p className='text-sm text-muted-foreground'>
        Structure ready: wire this list to{' '}
        <code>GET /api/v1/seller/products</code> once the seller catalog client
        is connected.
      </p>
      <div className='rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground'>
        No seller listings UI yet — API scaffolding is in place on the backend.
      </div>
    </div>
  )
}
