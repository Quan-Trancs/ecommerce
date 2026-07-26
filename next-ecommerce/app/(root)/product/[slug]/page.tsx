import ProductGallery from '@/components/shared/product/product-gallery'
import ProductPrice from '@/components/shared/product/product-price'
import ProductSlider from '@/components/shared/product/product-slider'
import ProductReviewsPanel from '@/components/shared/product/product-reviews-panel'
import ProductQaPanel from '@/components/shared/product/product-qa-panel'
import Rating from '@/components/shared/product/rating'
import SelectVariant from '@/components/shared/product/select-variant'
import BrowsingHistoryList from '@/components/shared/browsing-history-list'
import {
  getProductBySlug,
  getRelatedProductsByCategory,
} from '@/lib/actions/product.actions'
import { getProductReviewsPanel } from '@/lib/actions/review.actions'
import { getProductQaPanel } from '@/lib/actions/qa.actions'
import { Separator } from '@/components/ui/separator'
import AddToBrowsingHistory from '@/components/shared/product/add-to-browsing-history'
import AddToCart from '@/components/shared/product/add-to-cart'
import WishlistToggleButton from '@/components/shared/product/wishlist-toggle-button'
import StockAlertButton from '@/components/shared/product/stock-alert-button'
import CompareAddButton from '@/components/shared/product/compare-add-button'
import { roundToTwoDecimals } from '@/lib/utils'
import Link from 'next/link'
import { auth } from '@/auth'
import { getWishlistStatus, getWishlistStatusesForProducts } from '@/lib/actions/wishlist.actions'
import { getStockAlertStatus } from '@/lib/actions/stock-alert.actions'
import { getSellerShopSummary } from '@/lib/actions/shop.actions'
import { getProductSellerAccountId } from '@/lib/db/product-qa'

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
  const session = await auth()
  const [relatedProducts, reviewsPanel, qaPanel, wishlistStatus, stockAlert] =
    await Promise.all([
      getRelatedProductsByCategory({
        category: product.category,
        productId: product._id,
        page: Number(page || '1'),
      }),
      getProductReviewsPanel(product._id),
      getProductQaPanel(product._id),
      getWishlistStatus(product._id),
      getStockAlertStatus(product._id),
    ])
  const sellerAccountId =
    product.sellerAccountId ||
    (await getProductSellerAccountId(product._id))
  const sellerShop = await getSellerShopSummary(sellerAccountId)
  const relatedWishlist = await getWishlistStatusesForProducts(
    (relatedProducts.data || []).map((p) => p._id)
  )

  const avgRating = reviewsPanel.numReviews
    ? reviewsPanel.avgRating
    : product.avgRating
  const numReviews = reviewsPanel.numReviews || product.numReviews

  return (
    <div className='page-shell space-y-8 p-4 md:space-y-10 md:p-6'>
      <AddToBrowsingHistory id={product._id} category={product.category} />

      <section className='grid grid-cols-1 gap-5 md:grid-cols-5 md:gap-7'>
        <div className='brick col-span-1 p-3 md:col-span-2 md:p-4'>
          <p className='brick-label mb-3'>Gallery</p>
          <ProductGallery images={product.images} />
        </div>

        <div className='col-span-1 flex w-full flex-col gap-5 md:col-span-2'>
          <div className='brick space-y-3 p-4 md:p-5'>
            <p className='brick-label'>Product</p>
            <p className='text-sm font-medium text-slate-500'>
              <span className='font-semibold text-deal'>{product.brand}</span>
              <span className='mx-2 text-slate-300'>|</span>
              <Link
                href={`/search?category=${encodeURIComponent(product.category)}`}
                className='hover:text-chrome hover:underline'
              >
                {product.category}
              </Link>
              {sellerShop ? (
                <>
                  <span className='mx-2 text-slate-300'>|</span>
                  <Link
                    href={`/shop/${sellerShop.accountId}`}
                    className='hover:text-chrome hover:underline'
                  >
                    Sold by {sellerShop.shopName}
                  </Link>
                </>
              ) : null}
            </p>
            <h1 className='brick-title text-2xl lg:text-3xl'>{product.name}</h1>
            <div className='flex flex-wrap items-center gap-2 text-sm'>
              <span className='font-bold text-chrome'>
                {numReviews ? avgRating.toFixed(1) : '—'}
              </span>
              <Rating rating={numReviews ? avgRating : 0} />
              <span className='filter-count'>
                ({numReviews} rating{numReviews === 1 ? '' : 's'})
              </span>
            </div>
            <Separator className='bg-slate-900/10' />
            <ProductPrice
              price={product.price}
              listPrice={product.listPrice}
              isDeal={product.tags.includes('todays-deal')}
              forListing={false}
            />
          </div>

          <div className='brick space-y-4 p-4 md:p-5'>
            <p className='brick-label'>Options</p>
            <SelectVariant
              product={product}
              size={size || product.sizes[0]}
              color={color || product.colors[0]}
            />
          </div>

          <div className='brick space-y-2 p-4 md:p-5'>
            <p className='brick-label'>About</p>
            <p className='text-sm leading-relaxed text-slate-600 md:text-base'>
              {product.description}
            </p>
          </div>
        </div>

        <aside className='col-span-1'>
          <div className='brick-buybox space-y-4'>
            <p className='brick-label'>Buy box</p>
            <ProductPrice price={product.price} forListing={false} />
            {product.countInStock > 0 && product.countInStock < 3 && (
              <p className='text-sm font-bold text-deal'>
                Only {product.countInStock} left — order soon
              </p>
            )}
            {product.countInStock !== 0 ? (
              <p className='font-display text-lg font-bold text-emerald-700'>
                In Stock
              </p>
            ) : (
              <p className='font-display text-lg font-bold text-destructive'>
                Out of Stock
              </p>
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
            {product.countInStock === 0 ? (
              <StockAlertButton
                productId={product._id}
                initialSubscribed={stockAlert.subscribed}
                signedIn={stockAlert.signedIn}
              />
            ) : null}
            <WishlistToggleButton
              productId={product._id}
              initialWishlisted={wishlistStatus.wishlisted}
              signedIn={wishlistStatus.signedIn}
            />
            <CompareAddButton
              item={{
                id: product._id,
                slug: product.slug,
                name: product.name,
                image: product.images[0],
                price: product.price,
              }}
            />
          </div>
        </aside>
      </section>

      <ProductReviewsPanel
        productId={product._id}
        productSlug={product.slug}
        signedIn={Boolean(session?.user?.id)}
        canReview={reviewsPanel.canReview}
        myReview={reviewsPanel.myReview}
        reviews={reviewsPanel.reviews}
        avgRating={reviewsPanel.avgRating}
        numReviews={reviewsPanel.numReviews}
        ratingDistribution={reviewsPanel.ratingDistribution}
      />

      <ProductQaPanel
        productId={product._id}
        productSlug={product.slug}
        signedIn={Boolean(session?.user?.id)}
        canAnswer={qaPanel.canAnswer}
        canModerate={qaPanel.canModerate}
        canSellerHide={qaPanel.canSellerHide}
        accountId={session?.user?.id}
        questions={qaPanel.questions}
      />

      <section className='store-section'>
        <ProductSlider
          products={relatedProducts.data}
          title={`Best Sellers in ${product.category}`}
          href={`/search?category=${encodeURIComponent(product.category)}`}
          wishlistedIds={relatedWishlist.wishlistedIds}
          signedIn={relatedWishlist.signedIn}
        />
      </section>

      <section className='store-section'>
        <BrowsingHistoryList excludeId={product._id} />
      </section>
    </div>
  )
}
