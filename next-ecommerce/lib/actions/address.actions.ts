'use server'

import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { formatError } from '@/lib/utils'
import type { ShippingAddress } from '@/types'
import { ShippingAddressSchema } from '@/lib/validator'
import {
  createSavedAddress,
  deleteSavedAddress,
  listSavedAddresses,
  setDefaultSavedAddress,
  updateSavedAddress,
  type SavedAddress,
} from '@/lib/db/saved-addresses'

export type { SavedAddress }

export async function getMySavedAddresses(): Promise<SavedAddress[]> {
  const session = await auth()
  if (!session?.user?.id) return []
  const rows = await listSavedAddresses(session.user.id)
  return JSON.parse(JSON.stringify(rows))
}

export async function saveMyAddress(input: {
  label?: string
  address: ShippingAddress
  isDefault?: boolean
  id?: number
}): Promise<{ success: boolean; message: string; address?: SavedAddress }> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: 'Sign in required' }
    }
    const parsed = ShippingAddressSchema.safeParse(input.address)
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.errors[0]?.message || 'Invalid address',
      }
    }

    const address =
      input.id != null
        ? await updateSavedAddress({
            accountId: session.user.id,
            id: input.id,
            label: input.label,
            address: parsed.data,
            isDefault: input.isDefault,
          })
        : await createSavedAddress({
            accountId: session.user.id,
            label: input.label,
            address: parsed.data,
            isDefault: input.isDefault,
          })

    if (!address) {
      return { success: false, message: 'Address not found' }
    }

    revalidatePath('/account/addresses')
    revalidatePath('/checkout')
    return {
      success: true,
      message: input.id != null ? 'Address updated' : 'Address saved',
      address: JSON.parse(JSON.stringify(address)),
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

export async function removeMyAddress(
  id: number
): Promise<{ success: boolean; message: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: 'Sign in required' }
    }
    const ok = await deleteSavedAddress(session.user.id, id)
    if (!ok) return { success: false, message: 'Address not found' }
    revalidatePath('/account/addresses')
    revalidatePath('/checkout')
    return { success: true, message: 'Address removed' }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

export async function makeDefaultMyAddress(
  id: number
): Promise<{ success: boolean; message: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: 'Sign in required' }
    }
    const ok = await setDefaultSavedAddress(session.user.id, id)
    if (!ok) return { success: false, message: 'Address not found' }
    revalidatePath('/account/addresses')
    revalidatePath('/checkout')
    return { success: true, message: 'Default address updated' }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}
