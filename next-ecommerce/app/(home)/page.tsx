import ProductSlider from '@/components/shared/product/product-slider'
import BrowsingHistoryList from '@/components/shared/browsing-history-list'
import { HomeCard } from '@/components/shared/home/home-card'
import { HomeCarousel } from '@/components/shared/home/home-carousel'
import {
  getCategoryTree,
  getProductsByTag,
  getProductsForCard,
} from '@/lib/actions/product.actions'
import data from '@/lib/data'

export default async function Page() {
  const [
    categoryTree,
    newArrivals,
    featureds,
    bestSellers,
    todaysDeals,
    bestSellingProducts,
    categoryProducts,
  ] = await Promise.all([
    getCategoryTree(),
    getProductsForCard({ tag: 'new-arrival', limit: 4 }),
    getProductsForCard({ tag: 'featured', limit: 4 }),
    getProductsForCard({ tag: 'best-seller', limit: 4 }),
    getProductsByTag({ tag: 'todays-deal' }),
    getProductsByTag({ tag: 'best-seller' }),
    getProductsByTag({ tag: 'new-arrival', limit: 8 }),
  ])

  const topCategories = categoryTree.slice(0, 4)
  const categoryItems = topCategories.map((category, index) => {
    const match =
      categoryProducts.find((product) =>
        product.category.toLowerCase().includes(category.name.toLowerCase())
      ) || categoryProducts[index % Math.max(categoryProducts.length, 1)]

    return {
      name: category.name,
      image: match?.images?.[0] || '/icons/logo.svg',
      href: `/search?category=${encodeURIComponent(category.slug)}`,
    }
  })

  const cards = [
    {
      title: 'Shop by category',
      link: { text: 'See More', href: '/search' },
      items: categoryItems,
    },
    {
      title: 'Explore New Arrivals',
      items: newArrivals,
      link: { text: 'View All', href: '/search?tag=new-arrival' },
    },
    {
      title: 'Discover Best Sellers',
      items: bestSellers,
      link: { text: 'View All', href: '/search?tag=best-seller' },
    },
    {
      title: 'Featured Products',
      items: featureds,
      link: { text: 'Shop Now', href: '/search?tag=featured' },
    },
  ]

  return (
    <>
      <HomeCarousel items={data.carousels} />

      <div className='relative -mt-10 md:-mt-16'>
        <div className='page-shell space-y-5 px-3 pb-8 md:px-4'>
          <HomeCard cards={cards} />

          <section className='store-section'>
            <ProductSlider title="Today's Deals" products={todaysDeals} />
          </section>

          <section className='store-section'>
            <ProductSlider
              title='Best Selling Products'
              products={bestSellingProducts}
              hideDetails
            />
          </section>

          <section className='store-section'>
            <BrowsingHistoryList />
          </section>
        </div>
      </div>
    </>
  )
}
