export const metadata = { title: 'Admin users' }

export default function AdminUsersPage() {
  return (
    <div className='space-y-3'>
      <h2 className='text-xl font-semibold'>Users & roles</h2>
      <p className='text-sm text-muted-foreground'>
        Structure ready for account listing / role changes against store
        accounts (<code>GET /api/v1/accounts</code>).
      </p>
      <div className='rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground'>
        Seeded demos: buyer@example.com, seller@example.com, admin@example.com
      </div>
    </div>
  )
}
