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
import type { AbandonedCartItem } from '@/lib/db/abandoned-carts'

type Props = {
  displayName?: string | null
  items: AbandonedCartItem[]
  itemsTotal: number
}

export default function AbandonedCartEmail({
  displayName,
  items,
  itemsTotal,
}: Props) {
  const greeting = displayName?.trim() ? `Hi ${displayName.trim()},` : 'Hi,'

  return (
    <Html>
      <Preview>You left items in your {APP_NAME} cart</Preview>
      <Tailwind>
        <Head />
        <Body className='bg-white font-sans'>
          <Container className='max-w-xl'>
            <Heading>Still thinking it over?</Heading>
            <Text className='text-gray-700'>
              {greeting} you left {items.length} item
              {items.length === 1 ? '' : 's'} in your cart. Complete checkout
              when you are ready.
            </Text>
            <Section className='my-4 rounded-lg border border-solid border-gray-500 p-4 md:p-6'>
              {items.slice(0, 8).map((item) => (
                <Row key={`${item.slug}-${item.color}-${item.size}`} className='mt-6'>
                  <Column className='w-20'>
                    <Link href={`${SERVER_URL}/product/${item.slug}`}>
                      <Img
                        width='80'
                        alt={item.name}
                        className='rounded'
                        src={
                          item.image.startsWith('/')
                            ? `${SERVER_URL}${item.image}`
                            : item.image
                        }
                      />
                    </Link>
                  </Column>
                  <Column className='align-top pl-4'>
                    <Link
                      href={`${SERVER_URL}/product/${item.slug}`}
                      className='text-black no-underline'
                    >
                      <Text className='m-0 font-semibold'>{item.name}</Text>
                    </Link>
                    <Text className='m-0 text-sm text-gray-600'>
                      Qty {item.quantity}
                      {item.color || item.size
                        ? ` · ${[item.color, item.size].filter(Boolean).join(' / ')}`
                        : ''}
                    </Text>
                    <Text className='m-0 text-sm'>
                      {formatCurrency(item.price * item.quantity)}
                    </Text>
                  </Column>
                </Row>
              ))}
            </Section>
            <Text className='font-semibold'>
              Subtotal: {formatCurrency(itemsTotal)}
            </Text>
            <Text>
              <Link href={`${SERVER_URL}/cart`}>Return to your cart</Link>
            </Text>
            <Text className='text-xs text-gray-500'>
              You can turn off cart reminders in{' '}
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
