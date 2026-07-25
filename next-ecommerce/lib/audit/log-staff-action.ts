import { insertStaffAudit } from '@/lib/db/staff-audit'

/**
 * Fire-and-forget staff audit write. Never throws to callers.
 */
export async function logStaffAction(input: {
  actorId?: string | null
  actorRole?: string | null
  action: string
  entityType?: string | null
  entityId?: string | null
  summary: string
  metadata?: Record<string, unknown> | null
}): Promise<void> {
  try {
    await insertStaffAudit(input)
  } catch (error) {
    console.error('logStaffAction failed:', error)
  }
}
