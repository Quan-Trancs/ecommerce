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

export type DigestNoteItem = {
  orderId: string
  authorLabel: string
  authorRoleLabel: string
  body: string
  createdAtLabel: string
  orderUrl: string
}

export type OrderNoteDigestEmailProps = {
  notes: DigestNoteItem[]
}

function truncate(text: string, max = 280) {
  const trimmed = text.trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max - 1)}…`
}

export default function OrderNoteDigestEmail({
  notes,
}: OrderNoteDigestEmailProps) {
  const count = notes.length
  const preview =
    count === 1
      ? `1 new order message`
      : `${count} new order messages`

  return (
    <Html>
      <Preview>{preview}</Preview>
      <Tailwind>
        <Head />
        <Body className='font-sans bg-white'>
          <Container className='max-w-xl'>
            <Heading>
              {count === 1 ? 'New order message' : `${count} new order messages`}
            </Heading>
            <Text className='text-gray-700'>
              Here is your digest of public support-thread messages.
            </Text>
            {notes.map((note, index) => (
              <Section
                key={`${note.orderId}-${index}`}
                className='border border-solid border-gray-400 rounded-lg p-4 my-4 bg-gray-50'
              >
                <Text className='m-0 text-sm text-gray-500'>
                  Order {note.orderId} · {note.createdAtLabel}
                </Text>
                <Text className='mt-1 mb-2 font-medium'>
                  {note.authorLabel} ({note.authorRoleLabel})
                </Text>
                <Text className='m-0 whitespace-pre-wrap'>
                  {truncate(note.body)}
                </Text>
                <Text className='mb-0 mt-3'>
                  <Link href={note.orderUrl}>View thread</Link>
                </Text>
              </Section>
            ))}
            <Text className='text-sm text-gray-500'>
              Digests batch messages so you are not emailed for every reply.
              Manage preferences in your account settings.
            </Text>
            <Text className='text-xs text-gray-400'>{SERVER_URL}</Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
