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
import type { ReviewRequestProduct } from '@/lib/db/review-requests'

type Props = {
  displayName?: string | null
  orderId: string
  products: ReviewRequestProduct[]
}

export default function ReviewRequestEmail({
  displayName,
  orderId,
  products,
}: Props) {
  const greeting = displayName?.trim() ? `Hi ${displayName.trim()},` : 'Hi,'

  return (
    <Html>
      <Preview>How was your {APP_NAME} order?</Preview>
      <Tailwind>
        <Head />
        <Body className='bg-white font-sans'>
          <Container className='max-w-xl'>
            <Heading>How was your order?</Heading>
            <Text className='text-gray-700'>
              {greeting} your order {orderId} should have arrived. A short
              review helps other shoppers — and sellers improve.
            </Text>
            <Section className='my-4 rounded-lg border border-solid border-gray-500 p-4 md:p-6'>
              {products.slice(0, 8).map((item) => {
                const href = `${SERVER_URL}/product/${item.slug}`
                const img = item.image.startsWith('/')
                  ? `${SERVER_URL}${item.image}`
                  : item.image
                return (
                  <Row key={item.productId} className='mt-6'>
                    <Column className='w-20'>
                      <Link href={href}>
                        <Img
                          width='80'
                          alt={item.name}
                          className='rounded'
                          src={img}
                        />
                      </Link>
                    </Column>
                    <Column className='align-top pl-4'>
                      <Link href={href} className='text-black no-underline'>
                        <Text className='m-0 font-semibold'>{item.name}</Text>
                      </Link>
                      <Text className='m-0 text-sm'>
                        {formatCurrency(item.price)}
                      </Text>
                      <Text className='m-0 text-sm'>
                        <Link href={href}>Leave a review</Link>
                      </Text>
                    </Column>
                  </Row>
                )
              })}
            </Section>
            <Text>
              <Link href={`${SERVER_URL}/account/orders/${orderId}`}>
                View order
              </Link>
            </Text>
            <Text className='text-xs text-gray-500'>
              Manage email preferences in{' '}
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
