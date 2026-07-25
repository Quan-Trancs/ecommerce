import type { IOrderInput } from '@/types'

/** Client/order view model (Postgres store orders via Spring API). */
export type IOrder = IOrderInput & {
  _id: string
  createdAt: Date
  updatedAt: Date
  user: string | { email?: string; name?: string }
}
