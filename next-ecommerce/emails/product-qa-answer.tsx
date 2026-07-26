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
  answerBody: string
  answererName?: string | null
}

export default function ProductQaAnswerEmail({
  displayName,
  productName,
  productSlug,
  questionBody,
  answerBody,
  answererName,
}: Props) {
  const greeting = displayName?.trim() ? `Hi ${displayName.trim()},` : 'Hi,'
  const productUrl = `${SERVER_URL}/product/${productSlug}`
  const who = answererName?.trim() || 'the seller'

  return (
    <Html>
      <Preview>Your question about {productName} was answered</Preview>
      <Tailwind>
        <Head />
        <Body className='bg-white font-sans'>
          <Container className='max-w-xl'>
            <Heading>Your question was answered</Heading>
            <Text className='text-gray-700'>
              {greeting} {who} replied to your question on{' '}
              <Link href={productUrl}>{productName}</Link> at {APP_NAME}.
            </Text>
            <Section className='my-4 rounded-lg border border-solid border-gray-400 p-4'>
              <Text className='m-0 text-gray-500'>Your question</Text>
              <Text className='mt-1'>{questionBody}</Text>
              <Text className='mb-0 mt-4 text-gray-500'>Answer</Text>
              <Text className='mt-1'>{answerBody}</Text>
            </Section>
            <Text>
              <Link href={productUrl}>View the product Q&amp;A</Link>
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
