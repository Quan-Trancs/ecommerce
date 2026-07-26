'use client'

import { FormEvent, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  deleteMyShopAnnouncement,
  postMyShopAnnouncement,
  type ShopAnnouncement,
} from '@/lib/actions/shop-announcement.actions'
import { formatDateTime } from '@/lib/utils'

export default function SellerShopAnnouncementForm({
  announcements,
}: {
  announcements: ShopAnnouncement[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  return (
    <div className='space-y-4 rounded-lg border p-4'>
      <div>
        <p className='text-sm font-medium'>Shop announcement</p>
        <p className='mt-1 text-sm text-muted-foreground'>
          Post an update to your public shop. Followers with shop alerts on get
          an in-app notice and a batched email digest (up to 5 posts per day).
        </p>
      </div>

      <form
        className='space-y-3'
        onSubmit={(e: FormEvent) => {
          e.preventDefault()
          startTransition(async () => {
            const result = await postMyShopAnnouncement({ title, body })
            if (!result.success) {
              toast.error(result.message)
              return
            }
            toast.success(result.message)
            setTitle('')
            setBody('')
            router.refresh()
          })
        }}
      >
        <label className='block space-y-1 text-sm'>
          <span className='text-muted-foreground'>Title</span>
          <input
            className='w-full rounded-md border bg-background px-3 py-2'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            required
            disabled={pending}
            placeholder='Holiday shipping cutoff'
          />
        </label>
        <label className='block space-y-1 text-sm'>
          <span className='text-muted-foreground'>Message</span>
          <textarea
            className='min-h-[88px] w-full rounded-md border bg-background px-3 py-2'
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={500}
            required
            disabled={pending}
            placeholder='Short update for your followers…'
          />
        </label>
        <Button type='submit' size='sm' disabled={pending}>
          {pending ? 'Posting…' : 'Post announcement'}
        </Button>
      </form>

      {announcements.length > 0 ? (
        <ul className='space-y-3 border-t pt-3'>
          {announcements.map((item) => (
            <li key={item.id} className='space-y-1 text-sm'>
              <div className='flex flex-wrap items-start justify-between gap-2'>
                <p className='font-medium'>{item.title}</p>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  className='h-auto px-0 text-muted-foreground'
                  disabled={pending}
                  onClick={() => {
                    if (!window.confirm('Delete this announcement?')) return
                    startTransition(async () => {
                      const result = await deleteMyShopAnnouncement(item.id)
                      if (!result.success) {
                        toast.error(result.message)
                        return
                      }
                      toast.success(result.message)
                      router.refresh()
                    })
                  }}
                >
                  Delete
                </Button>
              </div>
              <p className='whitespace-pre-wrap text-muted-foreground'>
                {item.body}
              </p>
              <p className='text-xs text-muted-foreground'>
                {formatDateTime(new Date(item.createdAt)).dateTime}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
