'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  getMySavedAddresses,
  makeDefaultMyAddress,
  removeMyAddress,
  saveMyAddress,
  type SavedAddress,
} from '@/lib/actions/address.actions'
import type { ShippingAddress } from '@/types'

const emptyForm: ShippingAddress & { label: string; isDefault: boolean } = {
  label: '',
  fullName: '',
  street: '',
  city: '',
  province: '',
  postalCode: '',
  country: '',
  phone: '',
  isDefault: false,
}

export function AddressesManagerClient() {
  const router = useRouter()
  const [addresses, setAddresses] = useState<SavedAddress[]>([])
  const [form, setForm] = useState(emptyForm)
  const [pending, startTransition] = useTransition()

  function reload() {
    void getMySavedAddresses().then((rows) => setAddresses(rows))
  }

  useEffect(() => {
    reload()
  }, [])

  return (
    <div className='space-y-6'>
      <form
        className='grid max-w-2xl gap-3 rounded-lg border p-4 sm:grid-cols-2'
        onSubmit={(e) => {
          e.preventDefault()
          startTransition(async () => {
            const result = await saveMyAddress({
              label: form.label,
              isDefault: form.isDefault,
              address: {
                fullName: form.fullName,
                street: form.street,
                city: form.city,
                province: form.province,
                postalCode: form.postalCode,
                country: form.country,
                phone: form.phone,
              },
            })
            if (result.success) {
              toast.success(result.message)
              setForm(emptyForm)
              reload()
              router.refresh()
            } else toast.error(result.message)
          })
        }}
      >
        <label className='text-sm sm:col-span-2'>
          <span className='mb-1 block text-muted-foreground'>Label</span>
          <Input
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            placeholder='Home, Work…'
            disabled={pending}
          />
        </label>
        {(
          [
            ['fullName', 'Full name'],
            ['street', 'Street'],
            ['city', 'City'],
            ['province', 'Province'],
            ['postalCode', 'Postal code'],
            ['country', 'Country'],
            ['phone', 'Phone'],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className='text-sm'>
            <span className='mb-1 block text-muted-foreground'>{label}</span>
            <Input
              value={form[key]}
              onChange={(e) =>
                setForm((f) => ({ ...f, [key]: e.target.value }))
              }
              required
              disabled={pending}
            />
          </label>
        ))}
        <label className='flex items-center gap-2 text-sm sm:col-span-2'>
          <input
            type='checkbox'
            checked={form.isDefault}
            onChange={(e) =>
              setForm((f) => ({ ...f, isDefault: e.target.checked }))
            }
            disabled={pending}
          />
          Set as default
        </label>
        <Button type='submit' className='sm:col-span-2' disabled={pending}>
          Save address
        </Button>
      </form>

      {addresses.length === 0 ? (
        <p className='text-sm text-muted-foreground'>
          No saved addresses yet. They’ll also appear at checkout.
        </p>
      ) : (
        <ul className='divide-y rounded-lg border'>
          {addresses.map((address) => (
            <li
              key={address.id}
              className='flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between'
            >
              <div className='text-sm'>
                <p className='font-medium'>
                  {address.label || address.fullName}
                  {address.isDefault ? (
                    <span className='ml-2 text-xs text-muted-foreground'>
                      Default
                    </span>
                  ) : null}
                </p>
                <p className='text-muted-foreground'>
                  {address.fullName}
                  <br />
                  {address.street}
                  <br />
                  {address.city}, {address.province} {address.postalCode}
                  <br />
                  {address.country} · {address.phone}
                </p>
              </div>
              <div className='flex flex-wrap gap-2'>
                {!address.isDefault ? (
                  <Button
                    type='button'
                    size='sm'
                    variant='outline'
                    disabled={pending}
                    onClick={() => {
                      startTransition(async () => {
                        const result = await makeDefaultMyAddress(address.id)
                        if (result.success) {
                          toast.success(result.message)
                          reload()
                        } else toast.error(result.message)
                      })
                    }}
                  >
                    Make default
                  </Button>
                ) : null}
                <Button
                  type='button'
                  size='sm'
                  variant='ghost'
                  disabled={pending}
                  onClick={() => {
                    startTransition(async () => {
                      const result = await removeMyAddress(address.id)
                      if (result.success) {
                        toast.success(result.message)
                        reload()
                      } else toast.error(result.message)
                    })
                  }}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className='text-xs text-muted-foreground'>
        <Link href='/account' className='underline'>
          Back to account
        </Link>
      </p>
    </div>
  )
}
