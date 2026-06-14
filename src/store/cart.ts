'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem } from '@/types'

interface CartStore {
  items: CartItem[]
  cartOpen: boolean
  openCart: () => void
  closeCart: () => void
  addItem: (item: CartItem) => void
  removeItem: (uuid: string, extraMeat: boolean, extraVegetable: boolean, notes: string, flavourSelections?: Record<string, number>, optionSelections?: Record<string, string[]>) => void
  updateQuantity: (uuid: string, extraMeat: boolean, extraVegetable: boolean, notes: string, qty: number, flavourSelections?: Record<string, number>, optionSelections?: Record<string, string[]>) => void
  clearCart: () => void
  totalItems: () => number
  totalCents: () => number
}

function flavourKey(s?: Record<string, number>): string {
  if (!s) return ''
  return Object.entries(s)
    .filter(([, q]) => q > 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([f, q]) => `${f}:${q}`)
    .join(',')
}

function optionsKey(s?: Record<string, string[]>): string {
  if (!s || Object.keys(s).length === 0) return ''
  return Object.entries(s)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([g, choices]) => `${g}:[${[...choices].sort().join(',')}]`)
    .join(';')
}

function itemKey(item: Pick<CartItem, 'uuid' | 'extraMeat' | 'extraVegetable' | 'notes'> & { flavourSelections?: Record<string, number>; optionSelections?: Record<string, string[]> }) {
  return `${item.uuid}|${item.extraMeat}|${item.extraVegetable}|${item.notes}|${flavourKey(item.flavourSelections)}|${optionsKey(item.optionSelections)}`
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      cartOpen: false,
      openCart: () => set({ cartOpen: true }),
      closeCart: () => set({ cartOpen: false }),

      addItem: (newItem) => {
        const key = itemKey(newItem)
        set((state) => {
          const existing = state.items.find((i) => itemKey(i) === key)
          if (existing) {
            return { items: state.items.map((i) => itemKey(i) === key ? { ...i, quantity: i.quantity + newItem.quantity } : i) }
          }
          return { items: [...state.items, newItem] }
        })
      },

      removeItem: (uuid, extraMeat, extraVegetable, notes, flavourSelections, optionSelections) => {
        const key = itemKey({ uuid, extraMeat, extraVegetable, notes, flavourSelections, optionSelections })
        set((state) => ({ items: state.items.filter((i) => itemKey(i) !== key) }))
      },

      updateQuantity: (uuid, extraMeat, extraVegetable, notes, qty, flavourSelections, optionSelections) => {
        const key = itemKey({ uuid, extraMeat, extraVegetable, notes, flavourSelections, optionSelections })
        if (qty <= 0) {
          set((state) => ({ items: state.items.filter((i) => itemKey(i) !== key) }))
        } else {
          set((state) => ({ items: state.items.map((i) => itemKey(i) === key ? { ...i, quantity: qty } : i) }))
        }
      },

      clearCart: () => set({ items: [] }),
      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      totalCents: () => get().items.reduce((sum, i) => {
        const extras = (i.extraMeat ? 300 : 0) + (i.extraVegetable ? 300 : 0) + (i.optionExtrasCents ?? 0)
        return sum + (Math.round(i.price * 100) + extras) * i.quantity
      }, 0),
    }),
    { name: 'sn-cart', partialize: (s) => ({ items: s.items }) }
  )
)
