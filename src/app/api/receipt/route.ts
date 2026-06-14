import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getServiceClient } from '@/lib/supabase'
import { clientIp, hasTrustedOrigin, isRateLimited, readJson } from '@/lib/security'

const stripe = new Stripe((process.env.STRIPE_SECRET_KEY || '').replace(/^\uFEFF/, ''))

export async function POST(req: NextRequest) {
  if (!hasTrustedOrigin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (isRateLimited(`receipt:${clientIp(req)}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many receipt requests' }, { status: 429 })
  }

  let input: { email?: string; orderId?: string; sessionId?: string }
  try {
    input = await readJson(req, 4096)
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  const { email, orderId, sessionId } = input
  if (
    !email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    || !orderId || !/^[0-9a-f-]{36}$/i.test(orderId)
    || !sessionId || !sessionId.startsWith('cs_')
  ) {
    return NextResponse.json({ error: 'Invalid fields' }, { status: 400 })
  }

  const db = getServiceClient()
  const { data: order } = await db
    .from('orders')
    .select('id, stripe_session_id, total_cents')
    .eq('id', orderId)
    .eq('stripe_session_id', sessionId)
    .maybeSingle()
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (
      session.payment_status !== 'paid'
      || session.metadata?.order_id !== order.id
      || session.amount_total !== order.total_cents
      || !session.payment_intent
    ) {
      return NextResponse.json({ error: 'Payment not verified' }, { status: 403 })
    }
    const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent as string)
    if (!paymentIntent.latest_charge) return NextResponse.json({ error: 'Receipt unavailable' }, { status: 409 })
    await stripe.charges.update(paymentIntent.latest_charge as string, { receipt_email: email })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[Receipt] Failed to send receipt:', error)
    return NextResponse.json({ error: 'Failed to send receipt' }, { status: 502 })
  }
}
