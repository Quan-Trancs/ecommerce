import { IProduct } from '@/lib/db/models/product.model'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import Link from 'next/link'
import ImageHover from './image-hover'
import Image from 'next/image'
import Rating from './rating'
import { formatNumber, generateId, roundToTwoDecimals } from '@/lib/utils'
import ProductPrice from './product-price'
import AddToCart from './add-to-cart'

const ProductCard = ({
  product,
  hideBorders = false,
  hideDetails = false,
  hideAddToCart = false,
}: {
  product: IProduct
  hideBorders?: boolean
  hideDetails?: boolean
  hideAddToCart?: boolean
}) => {
  const ProductImage = () => (
    <Link href={`/product/${product.slug}`}>
      <div className='relative h-52'>
        {product.images.length > 1 ? (
          <ImageHover
            src={product.images[0]}
            alt={product.name}
            hoverSrc={product.images[1]}
          />
        ) : (
          <div className='relative h-52'>
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              sizes='80vw'
              className='object-contain'
            />
          </div>
        )}
      </div>
    </Link>
  )

  const ProductDetails = () => (
    <div className='flex-1 space-y-2'>
      <p className='font-bold'>{product.brand}</p>
      <Link
        href={`/product/${product.slug}`}
        className='overflow-hidden text-eclipse'
        style={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {product.name}
      </Link>
      <div className='flex gap-2 justify-center'>
        <Rating rating={product.avgRating} />
        <span>({formatNumber(product.numReviews)})</span>
      </div>
      <ProductPrice
        isDeal={product.tags.includes('todays-deal')}
        price={product.price}
        listPrice={product.listPrice}
        forListing
      />
    </div>
  )

  const AddButton = () => (
    <div className='w-full text-center'>
      <AddToCart
        minimal
        item={{
          clientId: generateId(),
          product: product._id,
          size: product.sizes[0],
          color: product.colors[0],
          countInStock: product.countInStock,
          name: product.name,
          slug: product.slug,
          category: product.category,
          quantity: 1,
          image: product.images[0],
          price: roundToTwoDecimals(product.price),
        }}
      />
    </div>
  )

  return hideBorders ? (
    <div className='flex flex-col'>
      <ProductImage />
      {!hideDetails && (
        <>
          <div className='flex-1 p-3 text-center'>
            <ProductDetails />
          </div>
          {!hideAddToCart && <AddButton />}
        </>
      )}
    </div>
  ) : (
    <Card className='flex flex-col'>
      <CardHeader className='p-3'>
        <ProductImage />
      </CardHeader>
      {!hideDetails && (
        <>
          <CardContent className='flex-1 p-3 text-center'>
            <ProductDetails />
          </CardContent>
          <CardFooter>{!hideAddToCart && <AddButton />}</CardFooter>
        </>
      )}
    </Card>
  )
}

export default ProductCard
