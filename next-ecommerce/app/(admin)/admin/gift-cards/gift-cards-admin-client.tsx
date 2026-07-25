'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import ProductPrice from '@/components/shared/product/product-price'
import {
  adminCreateGiftCard,
  adminToggleGiftCard,
  type GiftCard,
} from '@/lib/actions/gift-card.actions'
import { formatDateTime } from '@/lib/utils'

export function GiftCardsAdminClient({ cards }: { cards: GiftCard[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [code, setCode] = useState('')
  const [balance, setBalance] = useState('25')
  const [note, setNote] = useState('')

  return (
    <div className='space-y-6'>
      <form
        className='grid max-w-xl gap-3 rounded-lg border p-4 sm:grid-cols-2'
        onSubmit={(e) => {
          e.preventDefault()
          startTransition(async () => {
            const result = await adminCreateGiftCard({
              code: code || undefined,
              initialBalance: balance,
              note,
            })
            if (result.success) {
              toast.success(result.message)
              setCode('')
              setNote('')
              router.refresh()
            } else {
              toast.error(result.message)
            }
          })
        }}
      >
        <label className='text-sm sm:col-span-2'>
          <span className='mb-1 block text-muted-foreground'>
            Code (optional — auto-generated if blank)
          </span>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder='GIFT50'
            disabled={pending}
          />
        </label>
        <label className='text-sm'>
          <span className='mb-1 block text-muted-foreground'>Balance</span>
          <Input
            type='number'
            min={1}
            step='0.01'
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            disabled={pending}
          />
        </label>
        <label className='text-sm'>
          <span className='mb-1 block text-muted-foreground'>Note</span>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder='Optional'
            disabled={pending}
          />
        </label>
        <Button type='submit' className='sm:col-span-2' disabled={pending}>
          Create gift card
        </Button>
      </form>

      {cards.length === 0 ? (
        <p className='text-sm text-muted-foreground'>No gift cards yet.</p>
      ) : (
        <div className='overflow-x-auto rounded-md border'>
          <table className='w-full min-w-[640px] text-left text-sm'>
            <thead className='border-b bg-muted/40 font-mono text-[11px] uppercase tracking-wide text-muted-foreground'>
              <tr>
                <th className='px-3 py-2'>Code</th>
                <th className='px-3 py-2'>Remaining</th>
                <th className='px-3 py-2'>Initial</th>
                <th className='px-3 py-2'>Status</th>
                <th className='px-3 py-2'>Created</th>
                <th className='px-3 py-2'></th>
              </tr>
            </thead>
            <tbody>
              {cards.map((card) => (
                <tr key={card.id} className='border-b last:border-0'>
                  <td className='px-3 py-2 font-medium'>{card.code}</td>
                  <td className='px-3 py-2'>
                    <ProductPrice price={card.remainingBalance} plain />
                  </td>
                  <td className='px-3 py-2 text-muted-foreground'>
                    <ProductPrice price={card.initialBalance} plain />
                  </td>
                  <td className='px-3 py-2'>
                    {card.active ? 'Active' : 'Inactive'}
                  </td>
                  <td className='px-3 py-2 text-xs text-muted-foreground'>
                    {formatDateTime(new Date(card.createdAt)).dateTime}
                  </td>
                  <td className='px-3 py-2 text-right'>
                    <Button
                      type='button'
                      size='sm'
                      variant='outline'
                      disabled={pending}
                      onClick={() => {
                        startTransition(async () => {
                          const result = await adminToggleGiftCard(
                            card.id,
                            !card.active
                          )
                          if (result.success) {
                            toast.success(result.message)
                            router.refresh()
                          } else toast.error(result.message)
                        })
                      }}
                    >
                      {card.active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
