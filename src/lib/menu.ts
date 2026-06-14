import menuData from '@/data/menu.json'
import { MenuCategory } from '@/types'

export function getMenuCategories(): MenuCategory[] {
  return menuData.categories as MenuCategory[]
}

export function findItemByName(name: string) {
  const query = name.toLowerCase()
  for (const cat of menuData.categories) {
    for (const item of cat.items) {
      if (item.name.toLowerCase().includes(query)) return item
    }
  }
  return null
}

export function findItemByUuid(uuid: string) {
  for (const cat of menuData.categories) {
    for (const item of cat.items) {
      if (item.uuid === uuid) return item
    }
  }
  return null
}
