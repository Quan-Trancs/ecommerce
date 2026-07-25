import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = { title: 'Your Account' }

export default async function AccountPage() {
  const session = await auth()
  if (!session?.user) redirect('/sign-in')

  return (
    <div className='page-shell px-4 py-8 md:px-6'>
      <h1 className='mb-6 font-display text-3xl font-extrabold tracking-tight'>
        Your account
      </h1>
      <p className='mb-8 text-muted-foreground'>
        Signed in as {session.user.name || session.user.email}
      </p>
      <div className='grid gap-4 sm:grid-cols-2'>
        <Link href='/account/orders'>
          <Card className='transition hover:border-primary'>
            <CardHeader>
              <CardTitle>Your orders</CardTitle>
            </CardHeader>
            <CardContent className='text-sm text-muted-foreground'>
              Track and view past orders
            </CardContent>
          </Card>
        </Link>
        <Link href='/search'>
          <Card className='transition hover:border-primary'>
            <CardHeader>
              <CardTitle>Continue shopping</CardTitle>
            </CardHeader>
            <CardContent className='text-sm text-muted-foreground'>
              Browse the catalog
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
