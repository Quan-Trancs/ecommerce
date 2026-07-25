'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { setLowStockPreferences } from '@/lib/actions/account.actions'

export default function LowStockPreferencesForm({
  notifyLowStock,
  lowStockThreshold,
}: {
  notifyLowStock: boolean
  lowStockThreshold: number
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [enabled, setEnabled] = useState(notifyLowStock)
  const [threshold, setThreshold] = useState(String(lowStockThreshold))

  return (
    <form
      className='space-y-3 rounded-lg border p-4'
      onSubmit={(e) => {
        e.preventDefault()
        startTransition(async () => {
          const result = await setLowStockPreferences({
            notifyLowStock: enabled,
            lowStockThreshold: threshold,
          })
          if (result.success) {
            toast.success(result.message)
            router.refresh()
          } else {
            toast.error(result.message)
          }
        })
      }}
    >
      <div>
        <p className='text-sm font-medium'>Low-stock alerts</p>
        <p className='mt-1 text-sm text-muted-foreground'>
          In-app notifications when your listings hit the stock threshold
          (after sales or stock edits).
        </p>
      </div>
      <label className='flex items-start gap-2 text-sm'>
        <input
          type='checkbox'
          className='mt-1'
          checked={enabled}
          disabled={pending}
          onChange={(e) => setEnabled(e.target.checked)}
        />
        <span>
          <span className='font-medium'>Alert me when stock is low</span>
        </span>
      </label>
      <label className='block text-sm'>
        <span className='mb-1 block text-muted-foreground'>
          Threshold (units)
        </span>
        <Input
          type='number'
          min='0'
          max='9999'
          value={threshold}
          onChange={(e) => setThreshold(e.target.value)}
          disabled={pending || !enabled}
          className='max-w-[8rem]'
        />
      </label>
      <Button type='submit' disabled={pending}>
        {pending ? 'Saving…' : 'Save low-stock prefs'}
      </Button>
    </form>
  )
}
