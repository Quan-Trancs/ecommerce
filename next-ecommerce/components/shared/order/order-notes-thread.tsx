'use client'

import { FormEvent, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { addOrderNote, type OrderNote } from '@/lib/actions/order.actions'
import { formatDateTime } from '@/lib/utils'

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
}: {
  orderId: string
  initialNotes: OrderNote[]
}) {
  const router = useRouter()
  const [notes, setNotes] = useState(initialNotes)
  const [body, setBody] = useState('')
  const [pending, startTransition] = useTransition()

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = body.trim()
    if (!trimmed) {
      toast.error('Message is required')
      return
    }
    startTransition(async () => {
      const result = await addOrderNote(orderId, trimmed)
      if (result.success && result.note) {
        setNotes((prev) => [...prev, result.note!])
        setBody('')
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
        <div>
          <h2 className='text-xl pb-1'>Support thread</h2>
          <p className='text-sm text-muted-foreground'>
            Messages between you and support about this order.
          </p>
        </div>

        {notes.length === 0 ? (
          <p className='text-sm text-muted-foreground'>
            No messages yet. Ask a question or leave a note for support.
          </p>
        ) : (
          <ul className='max-h-80 space-y-3 overflow-y-auto pr-1'>
            {notes.map((note) => (
              <li
                key={note.id}
                className='rounded-md border bg-muted/30 px-3 py-2 text-sm'
              >
                <div className='mb-1 flex flex-wrap items-center gap-2'>
                  <span className='font-medium'>
                    {note.authorDisplayName || 'User'}
                  </span>
                  <Badge variant='outline'>{roleLabel(note.authorRole)}</Badge>
                  <span className='text-xs text-muted-foreground'>
                    {formatDateTime(new Date(note.createdAt)).dateTime}
                  </span>
                </div>
                <p className='whitespace-pre-wrap'>{note.body}</p>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={onSubmit} className='space-y-2'>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder='Write a message…'
            className='border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:opacity-50'
            disabled={pending}
          />
          <div className='flex items-center justify-between gap-2'>
            <span className='text-xs text-muted-foreground'>
              {body.length}/2000
            </span>
            <Button type='submit' disabled={pending || !body.trim()}>
              {pending ? 'Sending…' : 'Send message'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
