'use server'

import { auth } from '@/auth'
import { hasAdminAccess } from '@/lib/auth/roles'
import { listStaffAudit, type StaffAuditEntry } from '@/lib/db/staff-audit'

export type { StaffAuditEntry }

export async function getStaffAuditLog(filters?: {
  action?: string
  entityType?: string
  limit?: number
}): Promise<StaffAuditEntry[]> {
  const session = await auth()
  if (!hasAdminAccess(session?.user?.role)) return []
  const rows = await listStaffAudit({
    action: filters?.action,
    entityType: filters?.entityType,
    limit: filters?.limit,
  })
  return JSON.parse(JSON.stringify(rows))
}
