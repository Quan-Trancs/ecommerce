import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from '@react-email/components'
import { formatCurrency } from '@/lib/utils'
import { APP_NAME, SERVER_URL } from '@/lib/constants'
import type { ShopDigestListing } from '@/lib/db/shop-listing-digest'

type Props = {
  displayName?: string | null
  listings: ShopDigestListing[]
}

export default function ShopFollowDigestEmail({
  displayName,
  listings,
}: Props) {
  const greeting = displayName?.trim() ? `Hi ${displayName.trim()},` : 'Hi,'
  const count = listings.length

  return (
    <Html>
      <Preview>
        {count === 1
          ? `1 new listing from shops you follow on ${APP_NAME}`
          : `${count} new listings from shops you follow on ${APP_NAME}`}
      </Preview>
      <Tailwind>
        <Head />
        <Body className='bg-white font-sans'>
          <Container className='max-w-xl'>
            <Heading>New from shops you follow</Heading>
            <Text className='text-gray-700'>
              {greeting} here {count === 1 ? 'is a new listing' : 'are new listings'}{' '}
              from seller shops you follow.
            </Text>
            <Section className='my-4 rounded-lg border border-solid border-gray-500 p-4 md:p-6'>
              {listings.map((item) => {
                const productUrl = `${SERVER_URL}/product/${item.productSlug}`
                const shopUrl = `${SERVER_URL}/shop/${item.shopSlug}`
                const img =
                  item.imageUrl && item.imageUrl.startsWith('/')
                    ? `${SERVER_URL}${item.imageUrl}`
                    : item.imageUrl
                return (
                  <Row key={item.productId} className='mt-6'>
                    {img ? (
                      <Column className='w-20'>
                        <Link href={productUrl}>
                          <Img
                            width='80'
                            alt={item.productName}
                            className='rounded'
                            src={img}
                          />
                        </Link>
                      </Column>
                    ) : null}
                    <Column className='align-top pl-4'>
                      <Link href={productUrl} className='text-black no-underline'>
                        <Text className='m-0 font-semibold'>
                          {item.productName}
                        </Text>
                      </Link>
                      <Text className='m-0 text-sm text-gray-600'>
                        from{' '}
                        <Link href={shopUrl}>{item.shopName}</Link>
                      </Text>
                      {item.price != null ? (
                        <Text className='m-0 text-sm'>
                          {formatCurrency(item.price)}
                        </Text>
                      ) : null}
                    </Column>
                  </Row>
                )
              })}
            </Section>
            <Text>
              <Link href={`${SERVER_URL}/account/following`}>
                Manage followed shops
              </Link>
            </Text>
            <Text className='text-xs text-gray-500'>
              Digests are sent a few times a day. Opt out in{' '}
              <Link href={`${SERVER_URL}/account/settings`}>
                notification settings
              </Link>
              .
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
