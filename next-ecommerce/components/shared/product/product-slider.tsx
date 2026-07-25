import {
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  Carousel,
} from '@/components/ui/carousel'
import ProductCard from './product-card'
import { IProduct } from '@/lib/catalog/store-product'
import Link from 'next/link'

export default function ProductSlider({
  title,
  products,
  hideDetails = false,
  href,
}: {
  title: string
  products: IProduct[]
  hideDetails?: boolean
  href?: string
}) {
  return (
    <div className='w-full'>
      <div className='section-band'>
        <div>
          <p className='brick-label mb-1'>Collection</p>
          <h2 className='brick-title text-xl md:text-2xl'>{title}</h2>
        </div>
        {href && (
          <Link href={href} className='brick-link'>
            View all →
          </Link>
        )}
      </div>
      <Carousel opts={{ align: 'start' }} className='w-full'>
        <CarouselContent className='-ml-2 md:-ml-3'>
          {products.map((product) => (
            <CarouselItem
              key={product.slug}
              className={
                hideDetails
                  ? 'basis-1/2 pl-2 md:basis-1/4 md:pl-3 lg:basis-1/6'
                  : 'basis-1/2 pl-2 md:basis-1/3 md:pl-3 lg:basis-1/5'
              }
            >
              <div className={hideDetails ? '' : 'product-tile h-full'}>
                <ProductCard
                  product={product}
                  hideDetails={hideDetails}
                  hideAddToCart
                  hideBorders
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className='left-0 h-9 w-9 border border-slate-900/15 bg-white text-chrome hover:bg-chrome hover:text-white' />
        <CarouselNext className='right-0 h-9 w-9 border border-slate-900/15 bg-white text-chrome hover:bg-chrome hover:text-white' />
      </Carousel>
    </div>
  )
}
