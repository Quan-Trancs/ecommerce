import { IProduct } from '@/lib/catalog/store-product'
import Link from 'next/link'
import Image from 'next/image'
import Rating from './rating'
import { formatNumber, generateId, roundToTwoDecimals } from '@/lib/utils'
import ProductPrice from './product-price'
import AddToCart from './add-to-cart'
import WishlistHeartButton from './wishlist-heart-button'
import CompareToggleButton from './compare-toggle-button'
import ImageHover from './image-hover'
import {
  shopHref,
  type SellerShopCardInfo,
} from '@/lib/db/seller-shop'
import { shouldUnoptimizeProductImage } from '@/lib/storage/product-image-url'

const ProductCard = ({
  product,
  hideBorders = false,
  hideDetails = false,
  hideAddToCart = false,
  wishlisted,
  signedIn,
  shop,
}: {
  product: IProduct
  hideBorders?: boolean
  hideDetails?: boolean
  hideAddToCart?: boolean
  wishlisted?: boolean
  signedIn?: boolean
  shop?: SellerShopCardInfo | null
}) => {
  const ProductImage = () => (
    <div className='relative'>
      <Link href={`/product/${product.slug}`} className='block'>
        <div className='brick-media relative h-48 bg-white md:h-52'>
          {product.images.length > 1 ? (
            <ImageHover
              src={product.images[0]}
              alt={product.name}
              hoverSrc={product.images[1]}
            />
          ) : (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              sizes='280px'
              className='object-contain p-3 transition duration-300 hover:scale-105'
            />
          )}
        </div>
      </Link>
      <div className='absolute right-2 top-2 z-10 flex flex-col gap-2'>
        <WishlistHeartButton
          productId={product._id}
          initialWishlisted={wishlisted}
          signedIn={signedIn}
        />
        <CompareToggleButton
          item={{
            id: product._id,
            slug: product.slug,
            name: product.name,
            image: product.images[0],
            price: product.price,
          }}
        />
      </div>
    </div>
  )

  const ProductDetails = () => (
    <div className='flex-1 space-y-1.5 text-left'>
      <p className='brick-label !text-slate-500'>{product.brand}</p>
      {shop ? (
        <Link
          href={shopHref(shop)}
          className='flex items-center gap-1.5 text-xs text-slate-500 hover:text-chrome'
        >
          {shop.shopLogoUrl ? (
            <span className='relative h-4 w-4 shrink-0 overflow-hidden rounded-sm border border-slate-900/10 bg-muted'>
              <Image
                src={shop.shopLogoUrl}
                alt=''
                fill
                className='object-cover'
                sizes='16px'
                unoptimized={shouldUnoptimizeProductImage(shop.shopLogoUrl)}
              />
            </span>
          ) : null}
          <span className='truncate'>{shop.shopName}</span>
        </Link>
      ) : null}
      <Link
        href={`/product/${product.slug}`}
        className='line-clamp-2 text-sm font-semibold leading-snug text-chrome hover:text-deal'
      >
        {product.name}
      </Link>
      <div className='flex items-center gap-2'>
        <Rating rating={product.avgRating} />
        <span className='filter-count'>({formatNumber(product.numReviews)})</span>
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
    <div className='w-full pt-1'>
      <AddToCart
        minimal
        item={{
          clientId: generateId(),
          product: product._id,
          size: product.sizes[0] || 'Standard',
          color: product.colors[0] || 'Default',
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

  const body = (
    <>
      <ProductImage />
      {!hideDetails && (
        <div className='flex flex-1 flex-col gap-2 p-3'>
          <ProductDetails />
          {!hideAddToCart && <AddButton />}
        </div>
      )}
    </>
  )

  if (hideBorders) {
    return <div className='flex h-full flex-col'>{body}</div>
  }

  return <article className='product-tile'>{body}</article>
}

export default ProductCard
