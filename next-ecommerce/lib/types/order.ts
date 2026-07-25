import type { IOrderInput } from '@/types'

/** Client/order view model (Postgres store orders via Spring API). */
export type IOrder = IOrderInput & {
  _id: string
  status?: string
  /** True when any line has been marked shipped (blocks cancel). */
  hasShippedLines?: boolean
  createdAt: Date
  updatedAt: Date
  user: string | { email?: string; name?: string }
}
