'use client'

import { FormEvent, useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { addOrderNote, type OrderNote } from '@/lib/actions/order.actions'
import { setOrderInAppMute } from '@/lib/actions/notification.actions'
import { cn, formatDateTime } from '@/lib/utils'

function roleLabel(role: string) {
  const upper = (role || '').toUpperCase()
  if (upper === 'SUPPORT') return 'Support'
  if (upper === 'ADMIN') return 'Admin'
  if (upper === 'SELLER') return 'Seller'
  return 'Buyer'
}

export default function OrderNotesThread({
  orderId,
  initialNotes,
  canPostInternal = false,
  inAppMuted = false,
}: {
  orderId: string
  initialNotes: OrderNote[]
  /** SUPPORT/ADMIN may post and see INTERNAL notes. */
  canPostInternal?: boolean
  /** Current user muted in-app alerts for this order. */
  inAppMuted?: boolean
}) {
  const router = useRouter()
  const [notes, setNotes] = useState(initialNotes)
  const [body, setBody] = useState('')
  const [internal, setInternal] = useState(false)
  const [urgent, setUrgent] = useState(false)
  const [muted, setMuted] = useState(inAppMuted)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    setMuted(inAppMuted)
  }, [inAppMuted])

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = body.trim()
    if (!trimmed) {
      toast.error('Message is required')
      return
    }
    const visibility =
      canPostInternal && internal ? 'INTERNAL' : 'PUBLIC'
    startTransition(async () => {
      const result = await addOrderNote(orderId, trimmed, {
        visibility,
        urgent: visibility === 'PUBLIC' && urgent,
      })
      if (result.success && result.note) {
        setNotes((prev) => [...prev, result.note!])
        setBody('')
        setUrgent(false)
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <Card>
      <CardContent className='space-y-4 p-4'>
        <div className='flex flex-wrap items-start justify-between gap-2'>
          <div>
            <h2 className='text-xl pb-1'>Support thread</h2>
            <p className='text-sm text-muted-foreground'>
              {canPostInternal
                ? 'Buyer-visible messages and optional internal staff notes.'
                : 'Messages about this order with the buyer, sellers, and support.'}
            </p>
          </div>
          <Button
            type='button'
            variant='outline'
            size='sm'
            disabled={pending}
            onClick={() => {
              const next = !muted
              startTransition(async () => {
                const result = await setOrderInAppMute(orderId, next)
                if (result.success) {
                  setMuted(next)
                  toast.success(result.message)
                  router.refresh()
                } else {
                  toast.error(result.message)
                }
              })
            }}
          >
            {muted ? 'Unmute in-app alerts' : 'Mute in-app alerts'}
          </Button>
        </div>

        {muted ? (
          <p className='rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground'>
            In-app notifications for this order are muted. Email / SMS / push
            preferences are unchanged.
          </p>
        ) : null}

        {notes.length === 0 ? (
          <p className='text-sm text-muted-foreground'>
            {canPostInternal
              ? 'No messages yet. Reply to the buyer or leave an internal note.'
              : 'No messages yet. Ask a question or leave a note for support.'}
          </p>
        ) : (
          <ul className='max-h-80 space-y-3 overflow-y-auto pr-1'>
            {notes.map((note) => {
              const isInternal = note.visibility === 'INTERNAL'
              return (
                <li
                  key={note.id}
                  className={cn(
                    'rounded-md border px-3 py-2 text-sm',
                    isInternal
                      ? 'border-amber-500/40 bg-amber-500/5'
                      : note.urgent
                        ? 'border-red-500/40 bg-red-500/5'
                        : 'bg-muted/30'
                  )}
                >
                  <div className='mb-1 flex flex-wrap items-center gap-2'>
                    <span className='font-medium'>
                      {note.authorDisplayName || 'User'}
                    </span>
                    <Badge variant='outline'>{roleLabel(note.authorRole)}</Badge>
                    {isInternal ? (
                      <Badge variant='secondary'>Internal</Badge>
                    ) : null}
                    {note.urgent ? (
                      <Badge variant='destructive'>Urgent</Badge>
                    ) : null}
                    <span className='text-xs text-muted-foreground'>
                      {formatDateTime(new Date(note.createdAt)).dateTime}
                    </span>
                  </div>
                  <p className='whitespace-pre-wrap'>{note.body}</p>
                </li>
              )
            })}
          </ul>
        )}

        <form onSubmit={onSubmit} className='space-y-2'>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder={
              canPostInternal && internal
                ? 'Internal staff note (buyer cannot see)…'
                : 'Write a message…'
            }
            className='border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:opacity-50'
            disabled={pending}
          />
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <div className='flex flex-wrap items-center gap-3'>
              <span className='text-xs text-muted-foreground'>
                {body.length}/2000
              </span>
              {canPostInternal ? (
                <label className='flex items-center gap-2 text-xs text-muted-foreground'>
                  <input
                    type='checkbox'
                    checked={internal}
                    onChange={(e) => {
                      setInternal(e.target.checked)
                      if (e.target.checked) setUrgent(false)
                    }}
                    disabled={pending}
                  />
                  Internal (staff only)
                </label>
              ) : null}
              {!internal ? (
                <label className='flex items-center gap-2 text-xs text-muted-foreground'>
                  <input
                    type='checkbox'
                    checked={urgent}
                    onChange={(e) => setUrgent(e.target.checked)}
                    disabled={pending}
                  />
                  Urgent (SMS / push)
                </label>
              ) : null}
            </div>
            <Button type='submit' disabled={pending || !body.trim()}>
              {pending
                ? 'Sending…'
                : canPostInternal && internal
                  ? 'Save internal note'
                  : urgent
                    ? 'Send urgent'
                    : 'Send message'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
