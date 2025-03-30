import { ProductInputSchema } from '@/lib/validator'
import { z } from 'zod'

export type IProductInput = z.infer<typeof ProductInputSchema>

export type Data = {
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
