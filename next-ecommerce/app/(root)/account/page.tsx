import Link from 'next/link'
import { requireSession } from '@/lib/auth/require-role'
import { hasAdminAccess, hasSellerAccess, hasSupportAccess, roleLabel } from '@/lib/auth/roles'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = { title: 'Your Account' }

export default async function AccountPage() {
  const session = await requireSession()
  const role = session.user.role

  const links = [
    {
      href: '/account/orders',
      title: 'Your orders',
      description: 'Track and view past purchases',
    },
    {
      href: '/account/notifications',
      title: 'Notifications',
      description: 'In-app alerts for order messages',
    },
    {
      href: '/account/settings',
      title: 'Notification settings',
      description: 'Email preferences for order messages',
    },
    {
      href: '/search',
      title: 'Continue shopping',
      description: 'Browse the catalog',
    },
    ...(hasSellerAccess(role)
      ? [
          {
            href: '/seller',
            title: 'Seller dashboard',
            description: 'Manage listings and seller orders',
          },
        ]
      : []),
    ...(hasSupportAccess(role)
      ? [
          {
            href: '/support',
            title: 'Support desk',
            description: 'Look up customer orders',
          },
        ]
      : []),
    ...(hasAdminAccess(role)
      ? [
          {
            href: '/admin',
            title: 'Admin console',
            description: 'Platform users, catalog, and ops',
          },
        ]
      : []),
  ]

  return (
    <div className='page-shell px-4 py-8 md:px-6'>
      <h1 className='mb-2 font-display text-3xl font-extrabold tracking-tight'>
        Your account
      </h1>
      <p className='mb-8 text-muted-foreground'>
        {session.user.name || session.user.email} · {roleLabel(role)}
      </p>
      <div className='grid gap-4 sm:grid-cols-2'>
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className='h-full transition hover:border-primary'>
              <CardHeader>
                <CardTitle>{link.title}</CardTitle>
              </CardHeader>
              <CardContent className='text-sm text-muted-foreground'>
                {link.description}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
