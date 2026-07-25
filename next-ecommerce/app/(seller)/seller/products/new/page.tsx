import Link from 'next/link'
import SellerProductCreateForm from './seller-product-create-form'

export const metadata = { title: 'New seller product' }

export default function NewSellerProductPage() {
  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between gap-3'>
        <h2 className='text-xl font-semibold'>New product</h2>
        <Link
          href='/seller/products'
          className='text-sm text-muted-foreground hover:text-primary'
        >
          Back to list
        </Link>
      </div>
      <SellerProductCreateForm />
    </div>
  )
}
