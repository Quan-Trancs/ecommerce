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
  productName: string
  productSlug: string
  imageUrl?: string | null
  oldPrice: number
  newPrice: number
}

export default function PriceDropEmail({
  displayName,
  productName,
  productSlug,
  imageUrl,
  oldPrice,
  newPrice,
}: Props) {
  const greeting = displayName?.trim() ? `Hi ${displayName.trim()},` : 'Hi,'
  const productUrl = `${SERVER_URL}/product/${productSlug}`
  const img =
    imageUrl && imageUrl.startsWith('/')
      ? `${SERVER_URL}${imageUrl}`
      : imageUrl || null

  return (
    <Html>
      <Preview>
        Price drop on {productName} at {APP_NAME}
      </Preview>
      <Tailwind>
        <Head />
        <Body className='bg-white font-sans'>
          <Container className='max-w-xl'>
            <Heading>Price drop</Heading>
            <Text className='text-gray-700'>
              {greeting} an item on your wishlist got cheaper.
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
                  <Text className='m-0 text-sm text-gray-600'>
                    Was {formatCurrency(oldPrice)}
                  </Text>
                  <Text className='m-0 text-sm font-semibold'>
                    Now {formatCurrency(newPrice)}
                  </Text>
                </Column>
              </Row>
            </Section>
            <Text>
              <Link href={productUrl}>View product</Link>
              {' · '}
              <Link href={`${SERVER_URL}/account/wishlist`}>Wishlist</Link>
            </Text>
            <Text className='text-xs text-gray-500'>
              Manage alerts in{' '}
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
