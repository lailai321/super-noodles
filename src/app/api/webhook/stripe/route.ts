import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getServiceClient } from '@/lib/supabase'
import { sendOrderMessage } from '@/lib/telegram'
import { appendOrderToSheet } from '@/lib/sheets'
import { getOrderGifts } from '@/lib/giftRules'
import { escapeTelegramHtml } from '@/lib/security'

const stripBOM = (s: string) => s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s
const stripe = new Stripe(stripBOM(process.env.STRIPE_SECRET_KEY!))
const webhookSecret = stripBOM(process.env.STRIPE_WEBHOOK_SECRET!)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object as Stripe.Checkout.Session
  const orderId = session.metadata?.order_id
  if (!orderId) return NextResponse.json({ received: true })

  const db = getServiceClient()

  const { data: confirmedOrder, error: confirmError } = await db
    .from('orders')
    .update({ status: 'confirmed' })
    .eq('id', orderId)
    .eq('stripe_session_id', session.id)
    .eq('total_cents', session.amount_total ?? -1)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle()
  if (confirmError) {
    console.error('[Stripe webhook] Failed to confirm order:', confirmError.message)
    return NextResponse.json({ error: 'Could not confirm order' }, { status: 500 })
  }
  if (!confirmedOrder) return NextResponse.json({ received: true })

  const { data: order } = await db
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', orderId)
    .single()

  if (order) {
    type OItem = { quantity: number; item_name: string; extra_meat: boolean; extra_vegetable: boolean; notes: string; unit_price_cents: number }
    const itemLines = order.order_items
      .map((i: OItem) => {
        const extraCents = (i.extra_meat ? 300 : 0) + (i.extra_vegetable ? 300 : 0)
        const lineTotal = ((i.unit_price_cents + extraCents) * i.quantity / 100).toFixed(2)
        const lines: string[] = [`  x${i.quantity} ${escapeTelegramHtml(i.item_name)} - $${lineTotal}`]
        if (i.notes) {
          for (const part of i.notes.split(' | ')) {
            if (part.startsWith('Flavours:')) {
              part.slice('Flavours: '.length).split(', ').filter(Boolean)
                .forEach(f => lines.push(`    - ${escapeTelegramHtml(f)}`))
            } else if (part.startsWith('NOTE:')) {
              lines.push(`    Note: ${escapeTelegramHtml(part.slice(5))}`)
            } else {
              part.split(', ').filter(Boolean)
                .forEach(opt => lines.push(`    - ${escapeTelegramHtml(opt)}`))
            }
          }
        }
        if (i.extra_meat) lines.push(`    - Extra Meat +$3.00`)
        if (i.extra_vegetable) lines.push(`    - Extra Veg +$3.00`)
        return lines.join('\n')
      })
      .join('\n')

    const pickupLabel =
      order.pickup_time === 'asap' ? '~12 min (ASAP)' : order.pickup_time

    const orderTime = new Date(order.created_at).toLocaleString('en-AU', {
      timeZone: 'Australia/Sydney',
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    })

    const total = order.total_cents / 100
    const gifts = getOrderGifts(order.total_cents)
    const giftLines = gifts.map(g => `  - ${g}`).join('\n')
    const giftSection = gifts.length > 0
      ? `🎁 FREE GIFTS（记得送！）\n${giftLines}\n────────────────\n`
      : ''

    const msg = `🍜 <b>New Order #${String(order.order_number).padStart(4, '0')}</b>\n` +
      `🕐 ${orderTime}\n` +
      `────────────────\n` +
      `${itemLines}\n` +
      `────────────────\n` +
      `Subtotal: <b>$${total.toFixed(2)}</b>\n` +
      `────────────────\n` +
      giftSection +
      `Name: ${escapeTelegramHtml(order.customer_name)}\n` +
      `Phone: ${escapeTelegramHtml(order.customer_phone)}\n` +
      `Pickup: ${escapeTelegramHtml(pickupLabel)}`

    await sendOrderMessage(msg)

    try {
      await appendOrderToSheet(order)
    } catch (e) {
      console.error('[Sheets] append failed:', e)
    }
  }

  return NextResponse.json({ received: true })
}
