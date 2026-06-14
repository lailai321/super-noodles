import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { isAdminRequest } from '@/lib/adminAuth'
import { hasTrustedOrigin, readJson } from '@/lib/security'

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasTrustedOrigin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { uuid, price_cents, name, description, is_hidden } = await readJson<{
    uuid?: string; price_cents?: number | null; name?: string | null; description?: string | null; is_hidden?: boolean
  }>(req, 8192)
  if (
    !uuid || uuid.length > 100
    || (price_cents != null && (!Number.isInteger(price_cents) || price_cents < 0 || price_cents > 100_000))
    || (name != null && (typeof name !== 'string' || name.length > 200))
    || (description != null && (typeof description !== 'string' || description.length > 2000))
    || (is_hidden !== undefined && typeof is_hidden !== 'boolean')
  ) return NextResponse.json({ error: 'Invalid fields' }, { status: 400 })
  const db = getServiceClient()
  const { error } = await db.from('menu_overrides').upsert({
    item_uuid: uuid,
    ...(price_cents !== undefined && { price_cents }),
    ...(name !== undefined && { name }),
    ...(description !== undefined && { description }),
    ...(is_hidden !== undefined && { is_hidden }),
    updated_at: new Date().toISOString(),
  })
  if (error) return NextResponse.json({ error: 'Could not update item' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
