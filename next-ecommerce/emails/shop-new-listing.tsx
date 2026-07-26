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

type Props = {
  displayName?: string | null
  shopName: string
  shopSlug: string
  shopHref: string
  productName: string
  productSlug: string
  imageUrl?: string | null
  price?: number | null
}

export default function ShopNewListingEmail({
  displayName,
  shopName,
  shopHref: shopPath,
  productName,
  productSlug,
  imageUrl,
  price,
}: Props) {
  const greeting = displayName?.trim() ? `Hi ${displayName.trim()},` : 'Hi,'
  const productUrl = `${SERVER_URL}/product/${productSlug}`
  const shopUrl = `${SERVER_URL}${shopPath.startsWith('/') ? shopPath : `/${shopPath}`}`
  const img =
    imageUrl && imageUrl.startsWith('/')
      ? `${SERVER_URL}${imageUrl}`
      : imageUrl || null

  return (
    <Html>
      <Preview>
        New listing from {shopName} on {APP_NAME}
      </Preview>
      <Tailwind>
        <Head />
        <Body className='bg-white font-sans'>
          <Container className='max-w-xl'>
            <Heading>New from {shopName}</Heading>
            <Text className='text-gray-700'>
              {greeting} a shop you follow just published a new product.
            </Text>
            <Section className='my-4 rounded-lg border border-solid border-gray-500 p-4 md:p-6'>
              <Row>
                {img ? (
                  <Column className='w-20'>
                    <Link href={productUrl}>
                      <Img
                        width='80'
                        alt={productName}
                        className='rounded'
                        src={img}
                      />
                    </Link>
                  </Column>
                ) : null}
                <Column className='align-top pl-4'>
                  <Link href={productUrl} className='text-black no-underline'>
                    <Text className='m-0 font-semibold'>{productName}</Text>
                  </Link>
                  {price != null ? (
                    <Text className='m-0 text-sm'>
                      {formatCurrency(price)}
                    </Text>
                  ) : null}
                </Column>
              </Row>
            </Section>
            <Text>
              <Link href={productUrl}>View product</Link>
              {' · '}
              <Link href={shopUrl}>Visit {shopName}</Link>
            </Text>
            <Text className='text-xs text-gray-500'>
              Manage follows and alerts in{' '}
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
