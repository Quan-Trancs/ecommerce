import { query } from '@/lib/db/postgres'

export type TicketAssignment = {
  orderId: string
  assigneeId: string
  assigneeEmail: string | null
  assigneeName: string | null
  assignedBy: string | null
  assignedAt: string
}

type Row = {
  order_id: string
  assignee_id: string
  assignee_email: string | null
  assignee_name: string | null
  assigned_by: string | null
  assigned_at: Date | string
}

function mapRow(row: Row): TicketAssignment {
  return {
    orderId: row.order_id,
    assigneeId: row.assignee_id,
    assigneeEmail: row.assignee_email,
    assigneeName: row.assignee_name,
    assignedBy: row.assigned_by,
    assignedAt: new Date(row.assigned_at).toISOString(),
  }
}

export async function upsertTicketAssignment(input: {
  orderId: string
  assigneeId: string
  assignedBy: string
}): Promise<TicketAssignment> {
  const result = await query<Row>(
    `INSERT INTO support_ticket_assignments
       (order_id, assignee_id, assigned_by, assigned_at, updated_at)
     VALUES ($1, $2, $3, NOW(), NOW())
     ON CONFLICT (order_id) DO UPDATE
       SET assignee_id = EXCLUDED.assignee_id,
           assigned_by = EXCLUDED.assigned_by,
           assigned_at = NOW(),
           updated_at = NOW()
     RETURNING order_id, assignee_id, assigned_by, assigned_at`,
    [input.orderId, input.assigneeId, input.assignedBy]
  )
  const base = result.rows[0]
  if (!base) throw new Error('Failed to save assignment')
  const withUser = await query<Row>(
    `SELECT t.order_id, t.assignee_id, t.assigned_by, t.assigned_at,
            a.email AS assignee_email, a.display_name AS assignee_name
     FROM support_ticket_assignments t
     LEFT JOIN accounts a ON a.id = t.assignee_id
     WHERE t.order_id = $1`,
    [input.orderId]
  )
  return mapRow(withUser.rows[0] || {
    ...base,
    assignee_email: null,
    assignee_name: null,
  })
}

export async function clearTicketAssignment(orderId: string): Promise<void> {
  await query(
    `DELETE FROM support_ticket_assignments WHERE order_id = $1`,
    [orderId]
  )
}

export type SupportStaffOption = {
  id: string
  name: string
  email: string
  role: string
}

export async function listSupportStaff(): Promise<SupportStaffOption[]> {
  const result = await query<{
    id: string
    display_name: string | null
    email: string
    role: string
  }>(
    `SELECT id, display_name, email, role
     FROM accounts
     WHERE UPPER(COALESCE(role, '')) IN ('SUPPORT', 'ADMIN')
       AND COALESCE(active, TRUE) = TRUE
     ORDER BY display_name NULLS LAST, email`
  )
  return result.rows.map((row) => ({
    id: row.id,
    name: row.display_name || row.email.split('@')[0],
    email: row.email,
    role: row.role,
  }))
}
