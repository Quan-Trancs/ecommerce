'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import ProductPrice from '@/components/shared/product/product-price'
import { adminRecordSellerPayout } from '@/lib/actions/payout.actions'
import { formatDateTime } from '@/lib/utils'

type SellerBalance = {
  id: string
  email: string
  name: string
  role: string
  grossRevenue: number
  paidOut: number
  available: number
}

type PayoutRow = {
  id: number
  sellerAccountId: string
  sellerEmail?: string
  sellerName?: string
  amount: number
  note: string | null
  paidAt: string
}

export function PayoutsAdminClient({
  sellers,
  payouts,
}: {
  sellers: SellerBalance[]
  payouts: PayoutRow[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [sellerId, setSellerId] = useState(sellers[0]?.id || '')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  const selected = useMemo(
    () => sellers.find((s) => s.id === sellerId) || null,
    [sellers, sellerId]
  )

  return (
    <div className='space-y-6'>
      <form
        className='grid max-w-xl gap-3 rounded-lg border p-4'
        onSubmit={(e) => {
          e.preventDefault()
          startTransition(async () => {
            const result = await adminRecordSellerPayout({
              sellerAccountId: sellerId,
              amount,
              note,
            })
            if (result.success) {
              toast.success(result.message)
              setAmount('')
              setNote('')
              router.refresh()
            } else {
              toast.error(result.message)
            }
          })
        }}
      >
        <label className='text-sm'>
          <span className='mb-1 block text-muted-foreground'>Seller</span>
          <select
            className='border-input h-9 w-full rounded-md border bg-transparent px-2 text-sm'
            value={sellerId}
            onChange={(e) => setSellerId(e.target.value)}
            disabled={pending || sellers.length === 0}
            required
          >
            {sellers.map((seller) => (
              <option key={seller.id} value={seller.id}>
                {seller.name} ({seller.email}) — avail $
                {seller.available.toFixed(2)}
              </option>
            ))}
          </select>
        </label>
        {selected ? (
          <p className='text-xs text-muted-foreground'>
            Gross <ProductPrice price={selected.grossRevenue} plain /> · Paid
            out <ProductPrice price={selected.paidOut} plain /> · Available{' '}
            <span className='font-medium text-emerald-700'>
              <ProductPrice price={selected.available} plain />
            </span>
          </p>
        ) : null}
        <label className='text-sm'>
          <span className='mb-1 block text-muted-foreground'>Amount (USD)</span>
          <Input
            type='number'
            min='0.01'
            step='0.01'
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            disabled={pending}
            placeholder={
              selected ? String(selected.available.toFixed(2)) : '0.00'
            }
          />
        </label>
        <label className='text-sm'>
          <span className='mb-1 block text-muted-foreground'>Note</span>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={pending}
            placeholder='Wire · March settlement'
          />
        </label>
        <div className='flex flex-wrap gap-2'>
          <Button type='submit' disabled={pending || !sellerId}>
            {pending ? 'Recording…' : 'Record payout'}
          </Button>
          {selected && selected.available > 0 ? (
            <Button
              type='button'
              variant='outline'
              disabled={pending}
              onClick={() => setAmount(selected.available.toFixed(2))}
            >
              Fill available
            </Button>
          ) : null}
        </div>
      </form>

      <section className='space-y-2'>
        <h3 className='text-lg font-semibold'>Seller balances</h3>
        <div className='overflow-x-auto rounded-lg border'>
          <table className='w-full text-sm'>
            <thead className='bg-muted/40 text-left'>
              <tr>
                <th className='px-3 py-2'>Seller</th>
                <th className='px-3 py-2'>Gross</th>
                <th className='px-3 py-2'>Paid out</th>
                <th className='px-3 py-2'>Available</th>
              </tr>
            </thead>
            <tbody>
              {sellers.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className='px-3 py-6 text-center text-muted-foreground'
                  >
                    No sellers found
                  </td>
                </tr>
              ) : (
                sellers.map((seller) => (
                  <tr key={seller.id} className='border-t'>
                    <td className='px-3 py-2'>
                      <p className='font-medium'>{seller.name}</p>
                      <p className='text-xs text-muted-foreground'>
                        {seller.email}
                      </p>
                    </td>
                    <td className='px-3 py-2'>
                      <ProductPrice price={seller.grossRevenue} plain />
                    </td>
                    <td className='px-3 py-2'>
                      <ProductPrice price={seller.paidOut} plain />
                    </td>
                    <td className='px-3 py-2 font-medium text-emerald-700'>
                      <ProductPrice price={seller.available} plain />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className='space-y-2'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <h3 className='text-lg font-semibold'>Recent payouts</h3>
          {payouts.length > 0 ? (
            <Button type='button' variant='outline' size='sm' asChild>
              <a href='/api/admin/payouts/export'>Export CSV</a>
            </Button>
          ) : null}
        </div>
        {payouts.length === 0 ? (
          <p className='rounded-lg border border-dashed p-6 text-sm text-muted-foreground'>
            No payouts recorded yet.
          </p>
        ) : (
          <ul className='divide-y rounded-lg border'>
            {payouts.map((payout) => (
              <li
                key={payout.id}
                className='flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm'
              >
                <div>
                  <p className='font-medium'>
                    {payout.sellerName || payout.sellerEmail || payout.sellerAccountId}
                  </p>
                  <p className='text-muted-foreground'>
                    <ProductPrice price={payout.amount} plain />
                    {payout.note ? ` · ${payout.note}` : ''}
                  </p>
                </div>
                <p className='text-xs text-muted-foreground'>
                  {formatDateTime(new Date(payout.paidAt)).dateTime}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
