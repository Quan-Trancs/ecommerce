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
import { getCategoryTree } from '@/lib/actions/product.actions'
import type { CatalogCategory } from '@/lib/catalog/types'

function flattenTopCategories(tree: CatalogCategory[]) {
  return tree.map((c) => ({ name: c.name, slug: c.slug }))
}

export default async function Search() {
  const tree = await getCategoryTree()
  const categories = [
    { name: 'All', slug: 'all' },
    ...flattenTopCategories(tree),
  ]

  return (
    <form
      action={'/search'}
      method='get'
      className='flex h-11 items-stretch overflow-hidden rounded-full shadow-sm ring-1 ring-black/10 focus-within:ring-2 focus-within:ring-primary'
      role='search'
    >
      <Select name='category' defaultValue='all'>
        <SelectTrigger
          className='h-full w-auto min-w-[7rem] rounded-none border-0 border-r border-slate-200 bg-slate-100 text-sm text-slate-800'
          aria-label='Select product category'
        >
          <SelectValue placeholder='All' />
        </SelectTrigger>
        <SelectContent>
          {categories.map((category) => (
            <SelectItem key={category.slug} value={category.slug}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        className='h-full flex-1 rounded-none border-0 bg-white text-base text-slate-900 shadow-none focus-visible:ring-0'
        placeholder={`Search ${APP_NAME}`}
        name='q'
        type='search'
        aria-label={`Search ${APP_NAME} products`}
      />
      <button
        type='submit'
        className='flex h-full items-center justify-center bg-primary px-4 text-primary-foreground transition hover:brightness-95'
        aria-label='Search products'
      >
        <SearchIcon className='h-5 w-5' />
      </button>
    </form>
  )
}
