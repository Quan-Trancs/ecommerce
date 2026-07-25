import { query } from '@/lib/db/postgres'

export type StaffAuditEntry = {
  id: number
  actorId: string | null
  actorRole: string | null
  actorEmail?: string | null
  actorName?: string | null
  action: string
  entityType: string | null
  entityId: string | null
  summary: string
  metadata: Record<string, unknown> | null
  createdAt: string
}

type Row = {
  id: number | string
  actor_id: string | null
  actor_role: string | null
  actor_email?: string | null
  actor_name?: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  summary: string
  metadata_json: string | null
  created_at: Date | string
}

function mapRow(row: Row): StaffAuditEntry {
  let metadata: Record<string, unknown> | null = null
  if (row.metadata_json) {
    try {
      metadata = JSON.parse(row.metadata_json) as Record<string, unknown>
    } catch {
      metadata = { raw: row.metadata_json }
    }
  }
  return {
    id: Number(row.id),
    actorId: row.actor_id,
    actorRole: row.actor_role,
    actorEmail: row.actor_email,
    actorName: row.actor_name,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    summary: row.summary,
    metadata,
    createdAt: new Date(row.created_at).toISOString(),
  }
}

export async function insertStaffAudit(input: {
  actorId?: string | null
  actorRole?: string | null
  action: string
  entityType?: string | null
  entityId?: string | null
  summary: string
  metadata?: Record<string, unknown> | null
}): Promise<void> {
  await query(
    `INSERT INTO staff_audit_log
       (actor_id, actor_role, action, entity_type, entity_id, summary, metadata_json, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
    [
      input.actorId || null,
      input.actorRole || null,
      input.action.slice(0, 80),
      input.entityType || null,
      input.entityId || null,
      input.summary.slice(0, 500),
      input.metadata ? JSON.stringify(input.metadata) : null,
    ]
  )
}

export async function listStaffAudit(options?: {
  limit?: number
  action?: string | null
  entityType?: string | null
}): Promise<StaffAuditEntry[]> {
  const limit = Math.max(1, Math.min(options?.limit ?? 80, 200))
  const action = options?.action?.trim() || null
  const entityType = options?.entityType?.trim() || null
  const result = await query<Row>(
    `SELECT s.*, a.email AS actor_email, a.display_name AS actor_name
     FROM staff_audit_log s
     LEFT JOIN accounts a ON a.id = s.actor_id
     WHERE ($1::text IS NULL OR s.action = $1)
       AND ($2::text IS NULL OR s.entity_type = $2)
     ORDER BY s.created_at DESC
     LIMIT $3`,
    [action, entityType, limit]
  )
  return result.rows.map(mapRow)
}
