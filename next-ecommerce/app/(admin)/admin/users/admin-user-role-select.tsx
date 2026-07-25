'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { ALL_ROLES, type Role } from '@/lib/auth/roles'
import { updateAdminUserRole } from '@/lib/actions/admin.actions'

export default function AdminUserRoleSelect({
  userId,
  role,
  disabled,
}: {
  userId: string
  role: Role
  disabled?: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <select
      className='rounded-md border bg-background px-2 py-1 text-sm'
      value={role}
      disabled={disabled || pending}
      onChange={(e) => {
        const next = e.target.value as Role
        startTransition(async () => {
          const result = await updateAdminUserRole(userId, next)
          if (!result.success) {
            toast.error(result.message || 'Update failed')
            return
          }
          toast.success(`Role set to ${next}`)
          router.refresh()
        })
      }}
    >
      {ALL_ROLES.map((r) => (
        <option key={r} value={r}>
          {r}
        </option>
      ))}
    </select>
  )
}
