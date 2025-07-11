import { SearchIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { APP_NAME } from '@/lib/constants'

const categories = [
  'All',
  'Clothing',
  'Accessories',
  'Shoes',
  'Watches',
  'Jewelry',
]

export default async function Search() {
  return (
    <form action={'/search'} method='get' className='flex items-stretch h-10' role="search">
      <Select name='category'>
        <SelectTrigger 
          className='w-auto min-h-10 dark:border-gray-200 bg-gray-100 text-black border-r rounded-r-none rounded-l-md rtl:rounded-r-md rtl:rounded-l-none'
          aria-label="Select product category"
        >
          <SelectValue placeholder='All' />
        </SelectTrigger>
        <SelectContent>
          {categories.map((category) => (
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        className='flex-1 rounded-none dark:border-gray-200 bg-gray-100 text-black text-base h-full'
        placeholder={`Search Site ${APP_NAME}`}
        name='q'
        type='search'
        aria-label={`Search ${APP_NAME} products`}
      />
      <button
        type='submit'
        className='bg-primary text-primary-foreground text-black rounded-s-none rounded-e-md h-full px-3 py-2'
        aria-label="Search products"
      >
        <SearchIcon className='w-6 h-6' />
      </button>
    </form>
  )
}
