'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  assignSupportTicket,
  unassignSupportTicket,
  type SupportStaffOption,
  type SupportTicketRow,
} from '@/lib/actions/support.actions'

export function TicketAssignControls({
  ticket,
  currentUserId,
  staff,
}: {
  ticket: SupportTicketRow
  currentUserId: string
  staff: SupportStaffOption[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const isMine = ticket.assigneeId === currentUserId
  const isAssigned = Boolean(ticket.assigneeId)

  function run(action: () => Promise<{ success: boolean; message: string }>) {
    startTransition(async () => {
      const result = await action()
      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <div
      className='flex flex-wrap items-center gap-2'
      onClick={(e) => e.preventDefault()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {!isAssigned ? (
        <Button
          type='button'
          size='sm'
          variant='outline'
          disabled={pending}
          onClick={() =>
            run(() => assignSupportTicket({ orderId: ticket.orderId }))
          }
        >
          Claim
        </Button>
      ) : isMine ? (
        <Button
          type='button'
          size='sm'
          variant='outline'
          disabled={pending}
          onClick={() => run(() => unassignSupportTicket(ticket.orderId))}
        >
          Release
        </Button>
      ) : (
        <>
          <Button
            type='button'
            size='sm'
            variant='outline'
            disabled={pending}
            onClick={() =>
              run(() => assignSupportTicket({ orderId: ticket.orderId }))
            }
          >
            Take over
          </Button>
          <Button
            type='button'
            size='sm'
            variant='ghost'
            disabled={pending}
            onClick={() => run(() => unassignSupportTicket(ticket.orderId))}
          >
            Release
          </Button>
        </>
      )}
      <label className='flex items-center gap-1.5 text-xs text-muted-foreground'>
        <span className='sr-only'>Assign to</span>
        <select
          className='h-8 max-w-[11rem] rounded-md border bg-background px-2 text-xs'
          disabled={pending}
          value={ticket.assigneeId || ''}
          onChange={(e) => {
            const value = e.target.value
            if (!value) {
              run(() => unassignSupportTicket(ticket.orderId))
              return
            }
            if (value === ticket.assigneeId) return
            run(() =>
              assignSupportTicket({
                orderId: ticket.orderId,
                assigneeId: value,
              })
            )
          }}
        >
          <option value=''>Unassigned</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
              {s.id === currentUserId ? ' (you)' : ''}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
