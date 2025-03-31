import Link from 'next/link'
import CartButton from './cart-button'

export default function Menu() {
  return (
    <div className='flex justify-end'>
      <nav className='flex gap-3 w-full'>
        <Link href='/signin' className='header-button flex items-center'>
          Hello, Sign in
        </Link>

        <CartButton />
      </nav>
    </div>
  )
}
