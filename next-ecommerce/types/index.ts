import {
  CartSchema,
  OrderInputSchema,
  OrderItemSchema,
  ProductInputSchema,
  ShippingAddressSchema,
  UserInputSchema,
  UserSignInSchema,
  UserSignUpSchema,
} from '@/lib/validator'
import { z } from 'zod'

export type IProductInput = z.infer<typeof ProductInputSchema>

export type Data = {
  users: IUserInput[]
  products: IProductInput[]
  headerMenus: {
    name: string
    href: string
  }[]

  carousels: {
    image: string
    title: string
    url: string
    buttonCaption: string
    isPublished: boolean
  }[]
}

//ORDER
export type IOrderInput = z.infer<typeof OrderInputSchema>
export type OrderItem = z.infer<typeof OrderItemSchema>
export type Cart = z.infer<typeof CartSchema>

export type ShippingAddress = z.infer<typeof ShippingAddressSchema>

//USER
export type IUserInput = z.infer<typeof UserInputSchema>
export type IUserSignIn = z.infer<typeof UserSignInSchema>
export type IUserSignUp = z.infer<typeof UserSignUpSchema>
