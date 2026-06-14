import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { normalizeAustralianPhoneInput } from '@/lib/phone'
import { clientIp, isRateLimited } from '@/lib/security'

export async function GET(req: NextRequest) {
  if (isRateLimited(`track:${clientIp(req)}`, 30, 15 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many searches. Please try again later.' }, { status: 429 })
  }
  const phone = req.nextUrl.searchParams.get('phone')?.trim()
  if (!phone) return NextResponse.json({ orders: [] })
  if (phone.length > 30) return NextResponse.json({ orders: [] })

  const db = getServiceClient()
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  const normalized = normalizeAustralianPhoneInput(phone)
  if (!/^04\d{8}$/.test(normalized)) return NextResponse.json({ orders: [] })

  const { data, error } = await db
    .from('orders')
    .select('order_number, total_cents, pickup_time, status, created_at, order_items(item_name, quantity)')
    .eq('customer_phone', normalized)
    .neq('status', 'pending')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: 'Could not load orders' }, { status: 500 })
  const orders = (data ?? []).map(order => ({
      id: `${order.order_number}-${order.created_at}`,
      order_number: order.order_number,
      total_cents: order.total_cents,
      pickup_time: order.pickup_time,
      status: order.status,
      created_at: order.created_at,
      order_items: order.order_items,
  }))
  return NextResponse.json({ orders })
}
