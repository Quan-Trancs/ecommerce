import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type BrowsingHistoryItem = {
  id: string
  category: string
}

type BrowsingHistory = {
  products: BrowsingHistoryItem[]
}

const initialState: BrowsingHistory = {
  products: [],
}

export const BROWSING_HISTORY_MAX = 12

export const browsingHistoryStore = create<BrowsingHistory>()(
  persist(() => initialState, {
    name: 'browsingHistoryStore',
  })
)

export default function useBrowsingHistory() {
  const { products } = browsingHistoryStore()

  return {
    products,
    addItem: (product: BrowsingHistoryItem) => {
      const next = [
        product,
        ...products.filter((p) => p.id !== product.id),
      ].slice(0, BROWSING_HISTORY_MAX)
      browsingHistoryStore.setState({ products: next })
    },
    clear: () => {
      browsingHistoryStore.setState({ products: [] })
    },
  }
}
