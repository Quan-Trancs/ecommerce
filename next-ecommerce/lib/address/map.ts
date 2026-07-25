import type { ShippingAddress } from '@/types'

export type AddressFields = {
  fullName: string
  street: string
  city: string
  province: string
  postalCode: string
  country: string
  phone: string
}

export function savedAddressToShipping(address: AddressFields): ShippingAddress {
  return {
    fullName: address.fullName,
    street: address.street,
    city: address.city,
    province: address.province,
    postalCode: address.postalCode,
    country: address.country,
    phone: address.phone,
  }
}
