import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getServiceClient } from '@/lib/supabase'
import { isAdminRequest } from '@/lib/adminAuth'
import { hasTrustedOrigin, readJson } from '@/lib/security'

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasTrustedOrigin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { uuid, name, soldOut } = await readJson<{ uuid?: string; name?: string; soldOut?: boolean }>(req, 4096)
  if (!uuid || uuid.length > 100 || !name || name.length > 200 || typeof soldOut !== 'boolean') {
    return NextResponse.json({ error: 'Invalid fields' }, { status: 400 })
  }
  const db = getServiceClient()
  let error
  if (soldOut) {
    ;({ error } = await db.from('sold_out_items').upsert({ item_uuid: uuid, item_name: name }))
  } else {
    ;({ error } = await db.from('sold_out_items').delete().eq('item_uuid', uuid))
  }
  if (error) return NextResponse.json({ error: 'Could not update item' }, { status: 500 })
  revalidatePath('/api/menu')
  return NextResponse.json({ ok: true })
}
