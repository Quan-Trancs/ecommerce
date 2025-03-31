import { z } from 'zod'
import { formatNumberWithDecimal } from './utils'

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

export const CartSchema = z.object({
  items: z.array(OrderItemSchema).min(1, 'Cart must have at least one item'),
  itemsPrice: z.number(),
  taxPrice: z.number().optional(),
  shippingPrice: z.number().optional(),
  totalPrice: z.number(),
  paymentMethod: z.string().optional(),
  deliveryDateIndex: z.number().optional(),
  expectedDeliveryDate: z.date().optional(),
})
