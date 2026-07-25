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
import { SERVER_URL } from '@/lib/constants'

export type OrderNoteEmailProps = {
  orderId: string
  authorLabel: string
  authorRoleLabel: string
  body: string
  orderUrl: string
}

function truncate(text: string, max = 500) {
  const trimmed = text.trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max - 1)}…`
}

export default function OrderNoteEmail({
  orderId,
  authorLabel,
  authorRoleLabel,
  body,
  orderUrl,
}: OrderNoteEmailProps) {
  const preview = truncate(body, 120)
  return (
    <Html>
      <Preview>
        New message on order {orderId}: {preview}
      </Preview>
      <Tailwind>
        <Head />
        <Body className='font-sans bg-white'>
          <Container className='max-w-xl'>
            <Heading>New order message</Heading>
            <Text className='text-gray-700'>
              {authorLabel} ({authorRoleLabel}) posted on order {orderId}.
            </Text>
            <Section className='border border-solid border-gray-400 rounded-lg p-4 my-4 bg-gray-50'>
              <Text className='m-0 whitespace-pre-wrap'>{truncate(body)}</Text>
            </Section>
            <Text>
              <Link href={orderUrl}>View the support thread</Link>
            </Text>
            <Text className='text-sm text-gray-500'>
              You received this because you are a party on this order. Internal
              staff notes are not emailed.
            </Text>
            <Text className='text-xs text-gray-400'>{SERVER_URL}</Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
