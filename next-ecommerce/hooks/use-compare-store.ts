import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CompareItem = {
  id: string
  slug: string
  name: string
  image: string
  price: number
}

export const COMPARE_MAX = 4

type CompareState = {
  items: CompareItem[]
}

const initialState: CompareState = {
  items: [],
}

export const compareStore = create<CompareState>()(
  persist(() => initialState, {
    name: 'compareStore',
  })
)

export default function useCompareStore() {
  const { items } = compareStore()

  return {
    items,
    isCompared: (id: string) => items.some((item) => item.id === id),
    toggle: (item: CompareItem) => {
      const existing = items.find((p) => p.id === item.id)
      if (existing) {
        compareStore.setState({
          items: items.filter((p) => p.id !== item.id),
        })
        return { added: false as const, full: false as const }
      }
      if (items.length >= COMPARE_MAX) {
        return { added: false as const, full: true as const }
      }
      compareStore.setState({
        items: [...items, item],
      })
      return { added: true as const, full: false as const }
    },
    remove: (id: string) => {
      compareStore.setState({
        items: items.filter((p) => p.id !== id),
      })
    },
    clear: () => {
      compareStore.setState({ items: [] })
    },
  }
}
