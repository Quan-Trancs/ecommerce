import {
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  Carousel,
} from '@/components/ui/carousel'
import ProductCard from './product-card'
import { IProduct } from '@/lib/db/models/product.model'

export default function ProductSlider({
  title,
  products,
  hideDetails = false,
}: {
  title: string
  products: IProduct[]
  hideDetails?: boolean
}) {
  return (
    <div className='w-full'>
      <h2 className='font-display mb-5 text-xl font-bold tracking-tight md:text-2xl'>
        {title}
      </h2>
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
        <CarouselPrevious className='left-0 border-0 bg-white/95 shadow' />
        <CarouselNext className='right-0 border-0 bg-white/95 shadow' />
      </Carousel>
    </div>
  )
}
