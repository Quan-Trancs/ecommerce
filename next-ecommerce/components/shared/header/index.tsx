import { APP_NAME } from '@/lib/constants'
import Image from 'next/image'
import Link from 'next/link'
import Menu from './menu'
import { Button } from '@/components/ui/custom/custom-button'
import { MenuIcon } from 'lucide-react'
import Search from './search'
import data from '@/lib/data'

export default function Header() {
  return (
    <header className='sticky top-0 z-40 bg-chrome text-white shadow-[0_3px_0_rgb(240_161_26_/0.45)]'>
      <div className='page-shell px-3 md:px-4'>
        <div className='flex items-center justify-between gap-3 py-2.5'>
          <Link
            href='/'
            className='header-button m-0 flex items-center gap-2 font-display text-xl font-extrabold tracking-tight md:text-2xl'
          >
            <Image
              src='/icons/logo-dark.svg'
              alt={`${APP_NAME} logo`}
              width={36}
              height={36}
            />
            <span className='leading-none'>{APP_NAME}</span>
          </Link>

          <div className='hidden flex-1 md:block md:max-w-2xl lg:max-w-3xl'>
            <Search />
          </div>
          <Menu />
        </div>
        <div className='block pb-2.5 md:hidden'>
          <Search />
        </div>
      </div>

      <div className='border-t border-white/10 bg-chrome-muted'>
        <div className='page-shell flex items-center gap-1 overflow-x-auto px-2 md:px-3'>
          <Button
            variant='ghost'
            className='header-button dark flex shrink-0 items-center gap-1 text-sm font-medium [&_svg]:size-5'
          >
            <MenuIcon />
            All
          </Button>
          <nav className='flex items-center gap-1 py-1.5'>
            {data.headerMenus.map((menu) => (
              <Link
                href={menu.href}
                key={menu.href}
                className='header-button shrink-0 whitespace-nowrap !px-3 text-sm font-medium text-white/90'
              >
                {menu.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  )
}
