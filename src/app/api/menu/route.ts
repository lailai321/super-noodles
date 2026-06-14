import { NextResponse } from 'next/server'
import { getMenuCategories } from '@/lib/menu'
import { supabase } from '@/lib/supabase'

export const revalidate = 30

export async function GET() {
  const categories = getMenuCategories()

  const [soldOutRes, overridesRes] = await Promise.all([
    supabase.from('sold_out_items').select('item_uuid'),
    supabase.from('menu_overrides').select('*'),
  ])

  const soldOut = (soldOutRes.data ?? []).map((r: { item_uuid: string }) => r.item_uuid)
  const overrides: Record<string, unknown> = {}
  for (const row of overridesRes.data ?? []) {
    overrides[row.item_uuid] = row
  }

  return NextResponse.json({ categories, soldOut, overrides })
}
