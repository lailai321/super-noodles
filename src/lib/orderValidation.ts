import type { CartItem, MenuItem } from '@/types'
import { DRINK_FLAVOURS } from '@/lib/drinkFlavours'
import { ITEM_OPTIONS } from '@/lib/itemOptions'
import { findItemByUuid } from '@/lib/menu'

type MenuOverride = {
  item_uuid: string
  name: string | null
  price_cents: number | null
  is_hidden: boolean
}

export type ValidatedCartItem = CartItem & {
  name: string
  price: number
  optionExtrasCents: number
}

function validateOptions(item: CartItem) {
  const groups = ITEM_OPTIONS[item.uuid] || []
  const submitted = item.optionSelections || {}
  const allowedGroupIds = new Set(groups.map(group => group.id))
  if (Object.keys(submitted).some(id => !allowedGroupIds.has(id))) throw new Error('Invalid item options')

  let extras = 0
  for (const group of groups) {
    const selections = submitted[group.id] || []
    if (group.required && selections.length === 0) throw new Error(`Please select ${group.label}`)
    if (!group.multiSelect && selections.length > 1) throw new Error(`Invalid ${group.label} selection`)
    if (new Set(selections).size !== selections.length) throw new Error(`Duplicate ${group.label} selection`)
    for (const label of selections) {
      const choice = group.choices.find(candidate => candidate.label === label)
      if (!choice) throw new Error(`Invalid ${group.label} selection`)
      extras += choice.priceCents
    }
  }
  return extras
}

function validateFlavours(item: CartItem) {
  const allowed = DRINK_FLAVOURS[item.uuid]
  const submitted = item.flavourSelections
  if (!allowed) {
    if (submitted && Object.keys(submitted).length > 0) throw new Error('Invalid flavour selection')
    return
  }
  if (!submitted) throw new Error('Please select a drink flavour')
  let count = 0
  for (const [flavour, quantity] of Object.entries(submitted)) {
    if (!allowed.includes(flavour) || !Number.isInteger(quantity) || quantity < 0 || quantity > 20) {
      throw new Error('Invalid flavour selection')
    }
    count += quantity
  }
  if (count !== item.quantity) throw new Error('Drink flavour quantities do not match')
}

export function validateCart(items: unknown, overrides: MenuOverride[], soldOutUuids: Set<string>): ValidatedCartItem[] {
  if (!Array.isArray(items) || items.length === 0 || items.length > 50) throw new Error('Invalid cart')
  const overrideMap = new Map(overrides.map(override => [override.item_uuid, override]))
  let totalQuantity = 0

  return items.map(raw => {
    if (!raw || typeof raw !== 'object') throw new Error('Invalid cart item')
    const item = raw as CartItem
    const menuItem = findItemByUuid(item.uuid) as MenuItem | null
    const override = overrideMap.get(item.uuid)
    if (!menuItem || override?.is_hidden || soldOutUuids.has(item.uuid)) throw new Error('An item is unavailable')
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) throw new Error('Invalid quantity')
    totalQuantity += item.quantity
    if (totalQuantity > 100) throw new Error('Too many items')
    if (typeof item.notes !== 'string' || item.notes.length > 300) throw new Error('Notes are too long')
    if (typeof item.extraMeat !== 'boolean' || typeof item.extraVegetable !== 'boolean') throw new Error('Invalid extras')
    if (item.extraMeat && (!menuItem.hasAddons || menuItem.noExtraMeat)) throw new Error('Extra meat is unavailable')
    if (item.extraVegetable && (!menuItem.hasAddons || menuItem.noExtraVeg)) throw new Error('Extra vegetables are unavailable')

    validateFlavours(item)
    const optionExtrasCents = validateOptions(item)
    const priceCents = override?.price_cents ?? Math.round(menuItem.price * 100)
    if (!Number.isInteger(priceCents) || priceCents < 0 || priceCents > 100_000) throw new Error('Invalid menu price')

    return {
      ...item,
      name: override?.name?.trim() || menuItem.name,
      price: priceCents / 100,
      optionExtrasCents,
    }
  })
}
