'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  adminCreateCoupon,
  adminToggleCoupon,
  type Coupon,
} from '@/lib/actions/coupon.actions'

export function CouponsAdminClient({ coupons }: { coupons: Coupon[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [code, setCode] = useState('')
  const [discountType, setDiscountType] = useState<'PERCENT' | 'FIXED'>(
    'PERCENT'
  )
  const [discountValue, setDiscountValue] = useState('10')
  const [minSubtotal, setMinSubtotal] = useState('0')

  return (
    <div className='space-y-6'>
      <form
        className='grid max-w-xl gap-3 rounded-lg border p-4 sm:grid-cols-2'
        onSubmit={(e) => {
          e.preventDefault()
          startTransition(async () => {
            const result = await adminCreateCoupon({
              code,
              discountType,
              discountValue,
              minSubtotal,
              perUserLimit: 1,
            })
            if (result.success) {
              toast.success(result.message)
              setCode('')
              router.refresh()
            } else {
              toast.error(result.message)
            }
          })
        }}
      >
        <label className='text-sm sm:col-span-2'>
          <span className='mb-1 block text-muted-foreground'>Code</span>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder='SAVE15'
            required
            disabled={pending}
          />
        </label>
        <label className='text-sm'>
          <span className='mb-1 block text-muted-foreground'>Type</span>
          <select
            className='border-input h-9 w-full rounded-md border bg-transparent px-2 text-sm'
            value={discountType}
            onChange={(e) =>
              setDiscountType(e.target.value === 'FIXED' ? 'FIXED' : 'PERCENT')
            }
            disabled={pending}
          >
            <option value='PERCENT'>Percent</option>
            <option value='FIXED'>Fixed amount</option>
          </select>
        </label>
        <label className='text-sm'>
          <span className='mb-1 block text-muted-foreground'>Value</span>
          <Input
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            type='number'
            min='0.01'
            step='0.01'
            required
            disabled={pending}
          />
        </label>
        <label className='text-sm sm:col-span-2'>
          <span className='mb-1 block text-muted-foreground'>
            Minimum subtotal
          </span>
          <Input
            value={minSubtotal}
            onChange={(e) => setMinSubtotal(e.target.value)}
            type='number'
            min='0'
            step='0.01'
            disabled={pending}
          />
        </label>
        <Button type='submit' disabled={pending} className='sm:col-span-2'>
          {pending ? 'Saving…' : 'Create coupon'}
        </Button>
      </form>

      <div className='overflow-x-auto rounded-lg border'>
        <table className='w-full text-sm'>
          <thead className='bg-muted/40 text-left'>
            <tr>
              <th className='px-3 py-2'>Code</th>
              <th className='px-3 py-2'>Discount</th>
              <th className='px-3 py-2'>Min</th>
              <th className='px-3 py-2'>Uses</th>
              <th className='px-3 py-2'>Status</th>
              <th className='px-3 py-2' />
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className='px-3 py-6 text-center text-muted-foreground'
                >
                  No coupons yet
                </td>
              </tr>
            ) : (
              coupons.map((coupon) => (
                <tr key={coupon.id} className='border-t'>
                  <td className='px-3 py-2 font-medium'>{coupon.code}</td>
                  <td className='px-3 py-2'>
                    {coupon.discountType === 'PERCENT'
                      ? `${coupon.discountValue}%`
                      : `$${coupon.discountValue.toFixed(2)}`}
                  </td>
                  <td className='px-3 py-2'>
                    ${coupon.minSubtotal.toFixed(2)}
                  </td>
                  <td className='px-3 py-2'>
                    {coupon.redemptionCount ?? 0}
                    {coupon.maxRedemptions != null
                      ? ` / ${coupon.maxRedemptions}`
                      : ''}
                  </td>
                  <td className='px-3 py-2'>
                    {coupon.active ? 'Active' : 'Off'}
                  </td>
                  <td className='px-3 py-2 text-right'>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      disabled={pending}
                      onClick={() => {
                        startTransition(async () => {
                          const result = await adminToggleCoupon(
                            coupon.id,
                            !coupon.active
                          )
                          if (result.success) {
                            toast.success(result.message)
                            router.refresh()
                          } else {
                            toast.error(result.message)
                          }
                        })
                      }}
                    >
                      {coupon.active ? 'Disable' : 'Enable'}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
