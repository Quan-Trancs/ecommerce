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
import type { ShopDigestAnnouncement } from '@/lib/db/shop-announcement-digest'

type Props = {
  displayName?: string | null
  announcements: ShopDigestAnnouncement[]
}

export default function ShopAnnouncementDigestEmail({
  displayName,
  announcements,
}: Props) {
  const greeting = displayName?.trim() ? `Hi ${displayName.trim()},` : 'Hi,'
  const count = announcements.length

  return (
    <Html>
      <Preview>
        {count === 1
          ? `1 shop announcement on ${APP_NAME}`
          : `${count} shop announcements on ${APP_NAME}`}
      </Preview>
      <Tailwind>
        <Head />
        <Body className='bg-white font-sans'>
          <Container className='max-w-xl'>
            <Heading>Updates from shops you follow</Heading>
            <Text className='text-gray-700'>
              {greeting} here{' '}
              {count === 1 ? 'is a new announcement' : 'are new announcements'}{' '}
              from seller shops you follow.
            </Text>
            <Section className='my-4 rounded-lg border border-solid border-gray-500 p-4 md:p-6'>
              {announcements.map((item) => {
                const shopUrl = `${SERVER_URL}/shop/${item.shopSlug}`
                return (
                  <Section key={item.announcementId} className='mt-4'>
                    <Text className='m-0 text-sm text-gray-600'>
                      from <Link href={shopUrl}>{item.shopName}</Link>
                    </Text>
                    <Text className='m-0 mt-1 font-semibold text-black'>
                      {item.title}
                    </Text>
                    <Text className='m-0 mt-1 text-sm text-gray-700'>
                      {item.body.length > 200
                        ? `${item.body.slice(0, 199).trimEnd()}…`
                        : item.body}
                    </Text>
                    <Text className='m-0 mt-2 text-sm'>
                      <Link href={`${shopUrl}#shop-announcements`}>
                        View on shop
                      </Link>
                    </Text>
                  </Section>
                )
              })}
            </Section>
            <Text>
              <Link href={`${SERVER_URL}/account/following`}>
                Manage followed shops
              </Link>
            </Text>
            <Text className='text-xs text-gray-500'>
              Digests are sent a few times a day. Opt out in{' '}
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
