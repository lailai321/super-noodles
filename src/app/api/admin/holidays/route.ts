import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { isAdminRequest } from '@/lib/adminAuth'
import { hasTrustedOrigin, readJson } from '@/lib/security'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getServiceClient()
  const { data, error } = await db.from('holidays').select('date').order('date')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ holidays: (data ?? []).map((r: { date: string }) => r.date) })
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasTrustedOrigin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { date, action } = await readJson<{ date?: string; action?: string }>(req, 256)
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || (action !== 'add' && action !== 'remove')) {
    return NextResponse.json({ error: 'Invalid fields' }, { status: 400 })
  }
  const db = getServiceClient()
  if (action === 'add') {
    const { error } = await db.from('holidays').upsert({ date }, { onConflict: 'date' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    const { error } = await db.from('holidays').delete().eq('date', date)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }
  // Verify write succeeded
  const { data: verify, error: verifyErr } = await db.from('holidays').select('date').eq('date', date)
  return NextResponse.json({ ok: true, _written: action === 'add' ? (verify ?? []).length > 0 : (verify ?? []).length === 0, _verifyErr: verifyErr?.message ?? null })
}
