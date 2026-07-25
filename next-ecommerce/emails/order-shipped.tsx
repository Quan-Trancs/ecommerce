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
import { IOrder } from '@/lib/types/order'
import { SERVER_URL } from '@/lib/constants'

type Props = { order: IOrder }

const dateFormatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium' })

export default function OrderShippedEmail({ order }: Props) {
  return (
    <Html>
      <Preview>Your order has shipped</Preview>
      <Tailwind>
        <Head />
        <Body className='font-sans bg-white'>
          <Container className='max-w-xl'>
            <Heading>Your order is on the way</Heading>
            <Text className='text-gray-700'>
              Good news — items from order {order._id.toString()} have been marked
              shipped.
            </Text>
            <Section>
              <Row>
                <Column>
                  <Text className='mb-0 text-gray-500 whitespace-nowrap text-nowrap mr-4'>
                    Order ID
                  </Text>
                  <Text className='mt-0 mr-4'>{order._id.toString()}</Text>
                </Column>
                <Column>
                  <Text className='mb-0 text-gray-500 whitespace-nowrap text-nowrap mr-4'>
                    Updated
                  </Text>
                  <Text className='mt-0 mr-4'>
                    {dateFormatter.format(order.updatedAt || new Date())}
                  </Text>
                </Column>
                <Column>
                  <Text className='mb-0 text-gray-500 whitespace-nowrap text-nowrap mr-4'>
                    Order total
                  </Text>
                  <Text className='mt-0 mr-4'>
                    {formatCurrency(order.totalPrice)}
                  </Text>
                </Column>
              </Row>
            </Section>
            <Section className='border border-solid border-gray-500 rounded-lg p-4 md:p-6 my-4'>
              {order.items.map((item) => (
                <Row key={item.product} className='mt-8'>
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
                  <Column className='align-top'>
                    <Link href={`${SERVER_URL}/product/${item.slug}`}>
                      <Text className='mx-2 my-0'>
                        {item.name} x {item.quantity}
                      </Text>
                    </Link>
                  </Column>
                  <Column align='right' className='align-top'>
                    <Text className='m-0 '>{formatCurrency(item.price)}</Text>
                  </Column>
                </Row>
              ))}
            </Section>
            <Text>
              <Link href={`${SERVER_URL}/account/orders/${order._id}`}>
                View your order
              </Link>
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
