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
import { APP_NAME, SERVER_URL } from '@/lib/constants'
import type { SellerQaDigestItem } from '@/lib/db/seller-qa-digest'

type Props = {
  displayName?: string | null
  unansweredCount: number
  questions: SellerQaDigestItem[]
}

export default function ProductQaDigestEmail({
  displayName,
  unansweredCount,
  questions,
}: Props) {
  const greeting = displayName?.trim() ? `Hi ${displayName.trim()},` : 'Hi,'
  const inboxUrl = `${SERVER_URL}/seller/questions`
  const preview =
    unansweredCount === 1
      ? 'You have 1 unanswered product question'
      : `You have ${unansweredCount} unanswered product questions`

  return (
    <Html>
      <Preview>{preview}</Preview>
      <Tailwind>
        <Head />
        <Body className='bg-white font-sans'>
          <Container className='max-w-xl'>
            <Heading>Unanswered product questions</Heading>
            <Text className='text-gray-700'>
              {greeting} buyers are waiting on answers for your listings on{' '}
              {APP_NAME}.
            </Text>
            {questions.map((item) => (
              <Section
                key={item.questionId}
                className='my-4 rounded-lg border border-solid border-gray-400 p-4'
              >
                <Text className='m-0 text-gray-500'>{item.productName}</Text>
                <Text className='mt-1 font-semibold'>Q: {item.body}</Text>
                <Text className='m-0 text-sm text-gray-600'>
                  From {item.askerName}
                </Text>
                <Text className='mt-2 mb-0'>
                  <Link href={`${SERVER_URL}/product/${item.productSlug}`}>
                    View product
                  </Link>
                </Text>
              </Section>
            ))}
            {unansweredCount > questions.length ? (
              <Text className='text-sm text-gray-600'>
                And {unansweredCount - questions.length} more in your inbox.
              </Text>
            ) : null}
            <Text>
              <Link href={inboxUrl}>Open your Q&amp;A inbox</Link>
            </Text>
            <Text className='text-xs text-gray-500'>
              You can turn off these digests in{' '}
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
