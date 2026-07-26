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

type Props = {
  displayName?: string | null
  productName: string
  productSlug: string
  questionBody: string
  askerName?: string | null
  /** Inbox path for the CTA (seller vs staff). */
  inboxPath?: string
}

export default function ProductQaAskedEmail({
  displayName,
  productName,
  productSlug,
  questionBody,
  askerName,
  inboxPath = '/seller/questions',
}: Props) {
  const greeting = displayName?.trim() ? `Hi ${displayName.trim()},` : 'Hi,'
  const productUrl = `${SERVER_URL}/product/${productSlug}`
  const inboxUrl = `${SERVER_URL}${inboxPath.startsWith('/') ? inboxPath : `/${inboxPath}`}`
  const who = askerName?.trim() || 'A customer'

  return (
    <Html>
      <Preview>New question about {productName}</Preview>
      <Tailwind>
        <Head />
        <Body className='bg-white font-sans'>
          <Container className='max-w-xl'>
            <Heading>New product question</Heading>
            <Text className='text-gray-700'>
              {greeting} {who} asked about{' '}
              <Link href={productUrl}>{productName}</Link> on {APP_NAME}.
            </Text>
            <Section className='my-4 rounded-lg border border-solid border-gray-400 p-4'>
              <Text className='m-0 text-gray-500'>Question</Text>
              <Text className='mt-1'>{questionBody}</Text>
            </Section>
            <Text>
              <Link href={inboxUrl}>Answer in your Q&amp;A inbox</Link>
              {' · '}
              <Link href={productUrl}>View product</Link>
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
