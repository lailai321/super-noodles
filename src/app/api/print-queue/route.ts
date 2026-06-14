import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

function sydneyDate(value: string | Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Australia/Sydney',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date(value))
}

function authorized(req: NextRequest) {
  const secret = process.env.PRINT_SECRET
  return secret && req.headers.get('x-print-secret') === secret
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getServiceClient()

  const { data, error } = await db
    .from('orders')
    .select('id, order_number, customer_name, customer_phone, total_cents, pickup_time, created_at, order_items(id, item_name, quantity, unit_price_cents, extra_meat, extra_vegetable, notes)')
    .eq('printed', false)
    .neq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ orders: data ?? [] })
}
