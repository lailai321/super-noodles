import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/adminAuth'
import { getServiceClient } from '@/lib/supabase'
import { sendReadySms } from '@/lib/sms'
import { hasTrustedOrigin, readJson } from '@/lib/security'

type Action = 'acknowledge' | 'ready' | 'collected' | 'retry_sms'

function sydneyDate(value: string | Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Australia/Sydney',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

async function sendSmsForOrder(orderId: string) {
  const db = getServiceClient()

  const { data: claimed, error: claimError } = await db
    .from('orders')
    .update({ sms_status: 'sending', sms_error: null })
    .eq('id', orderId)
    .in('sms_status', ['not_sent', 'failed'])
    .select('id, order_number, customer_phone')
    .maybeSingle()

  if (claimError) throw new Error(claimError.message)
  if (!claimed) return { sent: false, skipped: true }

  try {
    const result = await sendReadySms(claimed.customer_phone, claimed.order_number)
    await db.from('orders').update({
      sms_status: 'sent',
      sms_sent_at: new Date().toISOString(),
      sms_error: null,
      sms_message_id: result.messageId,
    }).eq('id', orderId)
    return { sent: true, skipped: false }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'SMS failed'
    await db.from('orders').update({
      sms_status: 'failed',
      sms_error: message.slice(0, 500),
    }).eq('id', orderId)
    return { sent: false, skipped: false, error: message }
  }
}

const ORDER_SELECT = 'id, order_number, customer_name, customer_phone, total_cents, pickup_time, status, created_at, acknowledged_at, ready_at, collected_at, sms_status, sms_sent_at, sms_error, order_items(id, item_name, quantity, unit_price_cents, extra_meat, extra_vegetable, notes)'

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getServiceClient()
  const dateParam = req.nextUrl.searchParams.get('date')

  if (dateParam) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
    }
    // Query a UTC window wide enough to cover the full Sydney day (UTC+10/+11)
    const base = new Date(`${dateParam}T00:00:00.000Z`)
    const from = new Date(base.getTime() - 15 * 3_600_000).toISOString()
    const to   = new Date(base.getTime() + 39 * 3_600_000).toISOString()
    const { data, error } = await db
      .from('orders')
      .select(ORDER_SELECT)
      .gte('created_at', from)
      .lte('created_at', to)
      .neq('status', 'pending')
      .order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const orders = (data ?? []).filter(o => sydneyDate(o.created_at) === dateParam)
    return NextResponse.json({ orders })
  }

  // Compute UTC window that covers today in Australia/Sydney (UTC+10 AEST / UTC+11 AEDT)
  // Using ±15h buffer around midnight UTC safely captures the full Sydney day regardless of DST
  const todaySydney = sydneyDate(new Date())
  const base = new Date(`${todaySydney}T00:00:00.000Z`)
  const from = new Date(base.getTime() - 15 * 3_600_000).toISOString()
  const to   = new Date(base.getTime() + 39 * 3_600_000).toISOString()

  const { data, error } = await db
    .from('orders')
    .select(ORDER_SELECT)
    .gte('created_at', from)
    .lte('created_at', to)
    .neq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    const migrationNeeded = error.message.includes('acknowledged_at') || error.message.includes('sms_status')
    return NextResponse.json({
      error: migrationNeeded ? 'Order database migration is required' : error.message,
      migrationNeeded,
    }, { status: 500 })
  }

  // Precise Sydney-date filter after the UTC window query
  const orders = (data ?? []).filter(o => sydneyDate(o.created_at) === todaySydney)
  return NextResponse.json({
    orders,
    smsConfigured: Boolean(process.env.CLICKSEND_USERNAME && process.env.CLICKSEND_API_KEY),
  })
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasTrustedOrigin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { orderId, action } = await readJson<{ orderId?: string; action?: Action }>(req, 2048)
  if (!orderId || !action) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  if (!/^[0-9a-f-]{36}$/i.test(orderId) || !['acknowledge', 'ready', 'collected', 'retry_sms'].includes(action)) {
    return NextResponse.json({ error: 'Invalid fields' }, { status: 400 })
  }

  const db = getServiceClient()
  const now = new Date().toISOString()

  if (action === 'acknowledge') {
    const { error } = await db.from('orders')
      .update({ acknowledged_at: now })
      .eq('id', orderId)
      .is('acknowledged_at', null)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'ready') {
    const { data: updated, error } = await db.from('orders')
      .update({ status: 'ready', ready_at: now, acknowledged_at: now })
      .eq('id', orderId)
      .eq('status', 'confirmed')
      .select('id')
      .maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!updated) return NextResponse.json({ error: 'Order is no longer confirmed' }, { status: 409 })

    const sms = await sendSmsForOrder(orderId)
    return NextResponse.json({ ok: true, sms })
  }

  if (action === 'retry_sms') {
    const { data: order } = await db.from('orders')
      .select('status')
      .eq('id', orderId)
      .single()
    if (order?.status !== 'ready') {
      return NextResponse.json({ error: 'Only ready orders can resend SMS' }, { status: 409 })
    }
    const sms = await sendSmsForOrder(orderId)
    return NextResponse.json({ ok: true, sms })
  }

  if (action === 'collected') {
    const { data: updated, error } = await db.from('orders')
      .update({ status: 'collected', collected_at: now })
      .eq('id', orderId)
      .eq('status', 'ready')
      .select('id')
      .maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!updated) return NextResponse.json({ error: 'Order is not ready' }, { status: 409 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
