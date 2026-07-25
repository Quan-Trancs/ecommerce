import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components'
import { formatCurrency } from '@/lib/utils'
import { SERVER_URL } from '@/lib/constants'

export type OrderReturnEmailKind = 'SUBMITTED' | 'APPROVED' | 'REJECTED'

type Props = {
  orderId: string
  returnId: number
  kind: OrderReturnEmailKind
  reasonLabel: string
  buyerNote?: string | null
  reviewNote?: string | null
  refundAmount?: number | null
  lines: Array<{ name: string; quantity: number }>
}

function copyFor(kind: OrderReturnEmailKind) {
  if (kind === 'SUBMITTED') {
    return {
      preview: 'We received your return request',
      heading: 'Return request received',
      body: 'Thanks — your return request is in our queue. Support will review it shortly.',
    }
  }
  if (kind === 'APPROVED') {
    return {
      preview: 'Your return was approved',
      heading: 'Return approved',
      body: 'Good news — your return request was approved. Any refund will appear according to your payment method.',
    }
  }
  return {
    preview: 'Update on your return request',
    heading: 'Return request update',
    body: 'Your return request was not approved. See the staff note below for details, or reply on the order thread.',
  }
}

export default function OrderReturnEmail({
  orderId,
  returnId,
  kind,
  reasonLabel,
  buyerNote,
  reviewNote,
  refundAmount,
  lines,
}: Props) {
  const copy = copyFor(kind)
  const orderUrl = `${SERVER_URL}/account/orders/${orderId}`

  return (
    <Html>
      <Preview>{copy.preview}</Preview>
      <Tailwind>
        <Head />
        <Body className='bg-white font-sans'>
          <Container className='max-w-xl'>
            <Heading>{copy.heading}</Heading>
            <Text className='text-gray-700'>{copy.body}</Text>
            <Section className='my-4 rounded-lg border border-solid border-gray-400 p-4'>
              <Text className='m-0 text-gray-500'>Order</Text>
              <Text className='mt-0'>{orderId}</Text>
              <Text className='m-0 text-gray-500'>Return</Text>
              <Text className='mt-0'>#{returnId}</Text>
              <Text className='m-0 text-gray-500'>Reason</Text>
              <Text className='mt-0'>{reasonLabel}</Text>
              {lines.length > 0 ? (
                <>
                  <Text className='m-0 text-gray-500'>Items</Text>
                  <Text className='mt-0'>
                    {lines
                      .map((line) => `${line.name} ×${line.quantity}`)
                      .join(', ')}
                  </Text>
                </>
              ) : null}
              {buyerNote ? (
                <>
                  <Text className='m-0 text-gray-500'>Your note</Text>
                  <Text className='mt-0'>{buyerNote}</Text>
                </>
              ) : null}
              {reviewNote ? (
                <>
                  <Text className='m-0 text-gray-500'>Staff note</Text>
                  <Text className='mt-0'>{reviewNote}</Text>
                </>
              ) : null}
              {kind === 'APPROVED' && refundAmount != null ? (
                <>
                  <Text className='m-0 text-gray-500'>Refund</Text>
                  <Text className='mt-0'>{formatCurrency(refundAmount)}</Text>
                </>
              ) : null}
            </Section>
            <Text>
              <Link href={orderUrl}>View your order</Link>
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
