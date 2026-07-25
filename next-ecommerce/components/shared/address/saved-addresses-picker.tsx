'use client'

import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  getMySavedAddresses,
  removeMyAddress,
  makeDefaultMyAddress,
  type SavedAddress,
} from '@/lib/actions/address.actions'
import { savedAddressToShipping } from '@/lib/address/map'
import type { ShippingAddress } from '@/types'
import { cn } from '@/lib/utils'

export default function SavedAddressesPicker({
  onSelect,
  className,
}: {
  onSelect: (address: ShippingAddress) => void
  className?: string
}) {
  const [addresses, setAddresses] = useState<SavedAddress[]>([])
  const [loading, setLoading] = useState(true)
  const [pending, startTransition] = useTransition()

  function reload() {
    setLoading(true)
    void getMySavedAddresses()
      .then((rows) => setAddresses(rows))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    reload()
  }, [])

  if (loading) {
    return (
      <p className={cn('text-sm text-muted-foreground', className)}>
        Loading saved addresses…
      </p>
    )
  }

  if (addresses.length === 0) {
    return null
  }

  return (
    <div className={cn('space-y-3', className)}>
      <p className='text-sm font-medium'>Saved addresses</p>
      <ul className='space-y-2'>
        {addresses.map((address) => (
          <li
            key={address.id}
            className='rounded-md border p-3 text-sm'
          >
            <div className='flex flex-wrap items-start justify-between gap-2'>
              <div>
                <p className='font-medium'>
                  {address.label || address.fullName}
                  {address.isDefault ? (
                    <span className='ml-2 text-xs text-muted-foreground'>
                      Default
                    </span>
                  ) : null}
                </p>
                <p className='text-muted-foreground'>
                  {address.fullName} · {address.street}, {address.city},{' '}
                  {address.province} {address.postalCode}, {address.country}
                </p>
                <p className='text-xs text-muted-foreground'>{address.phone}</p>
              </div>
              <div className='flex flex-wrap gap-2'>
                <Button
                  type='button'
                  size='sm'
                  disabled={pending}
                  onClick={() => onSelect(savedAddressToShipping(address))}
                >
                  Use
                </Button>
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
                    Default
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
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
