import { listAdminUsers } from '@/lib/actions/admin.actions'
import AdminUserRoleSelect from './admin-user-role-select'

export const metadata = { title: 'Admin users' }

export default async function AdminUsersPage() {
  let users: Awaited<ReturnType<typeof listAdminUsers>> = []
  let error: string | null = null

  try {
    users = await listAdminUsers()
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load users'
  }

  return (
    <div className='space-y-4'>
      <div>
        <h2 className='text-xl font-semibold'>Users & roles</h2>
        <p className='text-sm text-muted-foreground'>
          Accounts live in Postgres (<code>accounts</code>). Role changes update
          the same row used by NextAuth and the store API.
        </p>
      </div>

      {error ? (
        <div className='rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive'>
          {error}
        </div>
      ) : users.length === 0 ? (
        <div className='rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground'>
          No users found. Run <code>npm run seed</code> in next-ecommerce
          (requires Postgres up).
        </div>
      ) : (
        <div className='overflow-x-auto rounded-lg border'>
          <table className='w-full text-left text-sm'>
            <thead className='border-b bg-muted/40 font-mono text-[11px] uppercase tracking-wider text-muted-foreground'>
              <tr>
                <th className='px-4 py-3'>Name</th>
                <th className='px-4 py-3'>Email</th>
                <th className='px-4 py-3'>Role</th>
                <th className='px-4 py-3'>Status</th>
              </tr>
            </thead>
            <tbody className='divide-y'>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className='px-4 py-3 font-medium'>{user.name}</td>
                  <td className='px-4 py-3 text-muted-foreground'>{user.email}</td>
                  <td className='px-4 py-3'>
                    <AdminUserRoleSelect userId={user.id} role={user.role} />
                  </td>
                  <td className='px-4 py-3 text-muted-foreground'>
                    {user.active ? 'Active' : 'Inactive'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
