import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

function authorized(req: NextRequest) {
  const secret = process.env.PRINT_SECRET
  return secret && req.headers.get('x-print-secret') === secret
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({})) as { orderId?: unknown; error?: unknown }
  const { orderId, error: printError } = body
  if (!orderId || typeof orderId !== 'string' || !/^[0-9a-f-]{36}$/i.test(orderId)) {
    return NextResponse.json({ error: 'Invalid orderId' }, { status: 400 })
  }

  const db = getServiceClient()
  const { error } = await db.from('orders').update({
    print_status: 'failed',
    print_error: typeof printError === 'string' ? printError.slice(0, 500) : 'Unknown error',
  }).eq('id', orderId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
