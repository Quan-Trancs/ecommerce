import { z } from 'zod'
import { formatNumberWithDecimal } from './utils'

//common
const MongoId = z.string().regex(/^[0-9a-fA-F]{24}$/, { message: 'Invalid ID' })

const Price = (field: string) =>
  z.coerce
    .number()
    .refine(
      (Value) => /^\d+(\.\d{2})?$/.test(formatNumberWithDecimal(Value)),
      `${field} must have exactly 2 decimal places`
    )

export const ProductInputSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  slug: z.string().min(3, 'Slug must be at least 3 characters'),
  category: z.string().min(1, 'Category is required'),
  images: z.array(z.string()).min(1, 'At least one image is required'),
  brand: z.string().min(1, 'Brand is required'),
  description: z.string().min(1, 'Description is required'),
  isPublished: z.boolean(),
  price: Price('Price'),
  listPrice: Price('List Price'),
  countInStock: z.coerce
    .number()
    .int()
    .nonnegative('Count in stock must be a non-negative integer'),
  tags: z.array(z.string()).default([]),
  sizes: z.array(z.string()).default([]),
  colors: z.array(z.string()).default([]),
  avgRating: z.coerce
    .number()
    .min(0, 'Average rating must be a non-negative number')
    .max(5, 'Average rating must be a number between 0 and 5'),
  numReviews: z.coerce
    .number()
    .int()
    .nonnegative('Number of reviews must be a non-negative integer'),
  ratingDistribution: z
    .array(z.object({ rating: z.number(), count: z.number() }))
    .max(5),
  reviews: z.array(z.string()).default([]),
  numSales: z.coerce
    .number()
    .int()
    .nonnegative('Number of sales must be a non-negative integer'),
})

export const ShippingAddressSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  province: z.string().min(1, 'Province is required'),
  phone: z.string().min(1, 'Phone is required'),
  country: z.string().min(1, 'Country is required'),
})

//ORDER
export const OrderItemSchema = z.object({
  clientId: z.string().min(1, 'Client ID is required'),
  product: z.string().min(1, 'Product is required'),
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  category: z.string().min(1, 'Category is required'),
  quantity: z
    .number()
    .int()
    .nonnegative('Quantity must be a non-negative integer'),
  countInStock: z
    .number()
    .int()
    .nonnegative('Count in stock must be a non-negative integer'),
  image: z.string().min(1, 'Image is required'),
  price: Price('Price'),
  color: z.string().optional(),
  size: z.string().optional(),
})

export const OrderInputSchema = z.object({
  user: z.union([
    MongoId,
    z.object({
      name: z.string(),
      email: z.string().email(),
    }),
  ]),
  items: z
    .array(OrderItemSchema)
    .min(1, 'Order must contain at least one item'),
  shippingAddress: ShippingAddressSchema,
  paymentMethod: z.string().min(1, 'Payment method is required'),
  paymentResult: z
    .object({
      id: z.string(),
      status: z.string(),
      email_address: z.string(),
      pricePaid: z.string(),
    })
    .optional(),
  itemsPrice: Price('Items price'),
  shippingPrice: Price('Shipping price'),
  taxPrice: Price('Tax price'),
  totalPrice: Price('Total price'),
  expectedDeliveryDate: z
    .date()
    .refine(
      (value) => value > new Date(),
      'Expected delivery date must be in the future'
    ),
  isDelivered: z.boolean().default(false),
  deliveredAt: z.date().optional(),
  isPaid: z.boolean().default(false),
  paidAt: z.date().optional(),
})

//CART

export const CartSchema = z.object({
  items: z.array(OrderItemSchema).min(1, 'Cart must have at least one item'),
  itemsPrice: z.number(),
  taxPrice: z.number().optional(),
  shippingPrice: z.number().optional(),
  totalPrice: z.number(),
  paymentMethod: z.string().optional(),
  shippingAddress: z.optional(ShippingAddressSchema),
  deliveryDateIndex: z.number().optional(),
  expectedDeliveryDate: z.date().optional(),
})

//USER

const UserName = z
  .string()
  .min(1, { message: 'Name is required' })
  .max(50, { message: 'Name must be at most 50 characters' })
const UserEmail = z
  .string()
  .min(1, { message: 'Email is required' })
  .email('Email is invalid')
const UserPassword = z
  .string()
  .min(6, { message: 'Password must be at least 6 characters' })
  .max(20, { message: 'Password must be at most 20 characters' })
const UserRole = z.string().min(1, { message: 'Role is required' })

export const UserInputSchema = z.object({
  name: UserName,
  email: UserEmail,
  image: z.string().optional(),
  emailVerified: z.boolean().default(false),
  password: UserPassword,
  role: UserRole,
  paymentMethod: z.string().min(1, { message: 'Payment method is required' }),
  address: z.object({
    fullName: z.string().min(1, { message: 'Full name is required' }),
    street: z.string().min(1, { message: 'Street is required' }),
    city: z.string().min(1, { message: 'City is required' }),
    province: z.string().min(1, { message: 'Province is required' }),
    country: z.string().min(1, { message: 'Country is required' }),
    postalCode: z.string().min(1, { message: 'Postal code is required' }),
    phoneNumber: z.string().min(1, { message: 'Phone number is required' }),
  }),
})

export const UserSignInSchema = z.object({
  email: UserEmail,
  password: UserPassword,
})

export const UserSignUpSchema = UserSignInSchema.extend({
  name: UserName,
  confirmPassword: UserPassword,
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})
