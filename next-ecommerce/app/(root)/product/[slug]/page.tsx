import ProductGallery from '@/components/shared/product/product-gallery'
import ProductPrice from '@/components/shared/product/product-price'
import ProductSlider from '@/components/shared/product/product-slider'
import Rating from '@/components/shared/product/rating'
import SelectVariant from '@/components/shared/product/select-variant'
import BrowsingHistoryList from '@/components/shared/browsing-history-list'
import {
  getProductBySlug,
  getRelatedProductsByCategory,
} from '@/lib/actions/product.actions'
import { Separator } from '@/components/ui/separator'
import AddToBrowsingHistory from '@/components/shared/product/add-to-browsing-history'
import AddToCart from '@/components/shared/product/add-to-cart'
import { roundToTwoDecimals } from '@/lib/utils'

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>
}) {
  const params = await props.params
  const product = await getProductBySlug(params.slug)
  if (!product) {
    return {
      title: 'Product not found',
    }
  }
  return {
    title: product.name,
    description: product.description,
  }
}

export default async function ProductDetails(props: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page: string; color: string; size: string }>
}) {
  const searchParams = await props.searchParams
  const { page, color, size } = searchParams
  const params = await props.params
  const { slug } = params
  const product = await getProductBySlug(slug)
  const relatedProducts = await getRelatedProductsByCategory({
    category: product.category,
    productId: product._id,
    page: Number(page || '1'),
  })

  return (
    <div className='page-shell space-y-10 p-4 md:p-6'>
      <AddToBrowsingHistory id={product._id} category={product.category} />
      <section className='grid grid-cols-1 gap-6 md:grid-cols-5 md:gap-8'>
        <div className='store-section col-span-1 md:col-span-2'>
          <ProductGallery images={product.images} />
        </div>

        <div className='col-span-1 flex w-full flex-col gap-4 md:col-span-2'>
          <div className='space-y-3'>
            <p className='text-sm font-medium text-muted-foreground'>
              Brand{' '}
              <span className='text-sky-700 hover:underline'>{product.brand}</span>
              <span className='mx-2 text-border'>|</span>
              {product.category}
            </p>
            <h1 className='font-display text-2xl font-bold tracking-tight lg:text-3xl'>
              {product.name}
            </h1>
            <div className='flex flex-wrap items-center gap-2 text-sm'>
              <span className='font-semibold'>{product.avgRating.toFixed(1)}</span>
              <Rating rating={product.avgRating} />
              <span className='text-muted-foreground'>
                ({product.numReviews} ratings)
              </span>
            </div>
            <Separator />
            <ProductPrice
              price={product.price}
              listPrice={product.listPrice}
              isDeal={product.tags.includes('todays-deal')}
              forListing={false}
            />
          </div>

          <SelectVariant
            product={product}
            size={size || product.sizes[0]}
            color={color || product.colors[0]}
          />

          <div className='space-y-2'>
            <p className='font-display text-base font-semibold'>About this item</p>
            <p className='text-sm leading-relaxed text-muted-foreground md:text-base'>
              {product.description}
            </p>
          </div>
        </div>

        <aside className='col-span-1'>
          <div className='store-section sticky top-28 space-y-4'>
            <ProductPrice price={product.price} forListing={false} />
            {product.countInStock > 0 && product.countInStock < 3 && (
              <p className='text-sm font-bold text-deal'>
                Only {product.countInStock} left in stock — order soon
              </p>
            )}
            {product.countInStock !== 0 ? (
              <p className='text-lg font-semibold text-emerald-700'>In Stock</p>
            ) : (
              <p className='text-lg font-semibold text-destructive'>Out of Stock</p>
            )}
            {product.countInStock !== 0 && (
              <AddToCart
                item={{
                  clientId: product._id,
                  product: product._id,
                  countInStock: product.countInStock,
                  name: product.name,
                  slug: product.slug,
                  category: product.category,
                  price: roundToTwoDecimals(product.price),
                  image: product.images[0],
                  color: color || product.colors[0] || 'Default',
                  quantity: 1,
                  size: size || product.sizes[0] || 'Standard',
                }}
              />
            )}
          </div>
        </aside>
      </section>

      <section className='store-section'>
        <ProductSlider
          products={relatedProducts.data}
          title={`Best Sellers in ${product.category}`}
        />
      </section>

      <section className='store-section'>
        <BrowsingHistoryList />
      </section>
    </div>
  )
}
