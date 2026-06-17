import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getServiceClient } from '@/lib/supabase'
import type { CartItem } from '@/types'
import { normalizeAustralianPhoneInput } from '@/lib/phone'
import { validateCart } from '@/lib/orderValidation'
import { clientIp, hasTrustedOrigin, isRateLimited, readJson } from '@/lib/security'

const stripBOM = (s: string) => s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s
const stripe = new Stripe(stripBOM(process.env.STRIPE_SECRET_KEY!))

type CheckoutInput = {
  name?: string
  phone?: string
  pickupTime?: string
  items?: unknown
  idempotencyKey?: string
}

function validPickupTime(value: string) {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Australia/Sydney' }))
  if (now.getDay() === 1) return false
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  if (value === 'asap') return currentMinutes >= 11 * 60 && currentMinutes < 20 * 60

  const match = value.match(/^(\d{1,2}):(00|15|30|45)(am|pm)$/)
  if (!match) return false
  let hour = Number(match[1]) % 12
  if (match[3] === 'pm') hour += 12
  const pickupMinutes = hour * 60 + Number(match[2])
  return pickupMinutes >= 11 * 60
    && pickupMinutes <= 20 * 60
    && pickupMinutes >= currentMinutes + 30
}

export async function POST(req: NextRequest) {
  if (!hasTrustedOrigin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (isRateLimited(`checkout:${clientIp(req)}`, 10, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many checkout attempts. Please try again shortly.' }, { status: 429 })
  }

  let input: CheckoutInput
  try {
    input = await readJson(req, 64_000)
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  const { name, phone, pickupTime, items, idempotencyKey } = input
  if (!name || !phone || !pickupTime || !items) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  if (name.trim().length < 2 || name.trim().length > 80) {
    return NextResponse.json({ error: 'Please enter a valid name.' }, { status: 400 })
  }
  if (!validPickupTime(pickupTime)) {
    return NextResponse.json({ error: 'Please select a valid pickup time.' }, { status: 400 })
  }
  if (idempotencyKey && !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotencyKey)) {
    return NextResponse.json({ error: 'Invalid request identifier.' }, { status: 400 })
  }

  const normalizedPhone = normalizeAustralianPhoneInput(phone)
  if (!/^04\d{8}$/.test(normalizedPhone)) {
    return NextResponse.json({ error: 'Please enter a valid Australian mobile number.' }, { status: 400 })
  }

  const db = getServiceClient()
  if (idempotencyKey) {
    const { data: duplicate } = await db
      .from('orders')
      .select('id')
      .eq('stripe_session_id', `idmptn_${idempotencyKey}`)
      .maybeSingle()
    if (duplicate) {
      return NextResponse.json({ error: 'Duplicate request. Your order is already being processed.' }, { status: 409 })
    }
  }

  const [{ data: overrides, error: overridesError }, { data: soldOut, error: soldOutError }] = await Promise.all([
    db.from('menu_overrides').select('item_uuid, name, price_cents, is_hidden'),
    db.from('sold_out_items').select('item_uuid'),
  ])
  if (overridesError || soldOutError) {
    return NextResponse.json({ error: 'Could not verify the menu. Please try again.' }, { status: 503 })
  }

  let validatedItems: ReturnType<typeof validateCart>
  try {
    validatedItems = validateCart(items, overrides ?? [], new Set((soldOut ?? []).map(row => row.item_uuid)))
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid cart' }, { status: 400 })
  }

  const totalCents = validatedItems.reduce((sum, item) => {
    const extras = (item.extraMeat ? 300 : 0) + (item.extraVegetable ? 300 : 0) + item.optionExtrasCents
    return sum + (Math.round(item.price * 100) + extras) * item.quantity
  }, 0)

  const { data: order, error } = await db
    .from('orders')
    .insert({
      customer_name: name.trim(),
      customer_phone: normalizedPhone,
      total_cents: totalCents,
      pickup_time: pickupTime,
      stripe_session_id: idempotencyKey ? `idmptn_${idempotencyKey}` : `pending_${crypto.randomUUID()}`,
      status: 'pending',
    })
    .select()
    .single()

  if (error || !order) return NextResponse.json({ error: 'Could not create order' }, { status: 500 })

  function itemNotes(item: CartItem) {
    const parts: string[] = []
    if (item.optionSelections) {
      const options = Object.values(item.optionSelections).flat().filter(Boolean).join(', ')
      if (options) parts.push(options)
    }
    if (item.flavourSelections) {
      const flavours = Object.entries(item.flavourSelections)
        .filter(([, quantity]) => quantity > 0)
        .map(([flavour, quantity]) => `${flavour} x${quantity}`)
        .join(', ')
      if (flavours) parts.push(`Flavours: ${flavours}`)
    }
    if (item.notes.trim()) parts.push(`NOTE:${item.notes.trim()}`)
    return parts.join(' | ')
  }

  const { error: itemError } = await db.from('order_items').insert(
    validatedItems.map(item => ({
      order_id: order.id,
      item_uuid: item.uuid,
      item_name: item.name,
      quantity: item.quantity,
      unit_price_cents: Math.round(item.price * 100) + item.optionExtrasCents,
      extra_meat: item.extraMeat,
      extra_vegetable: item.extraVegetable,
      notes: itemNotes(item),
    }))
  )
  if (itemError) {
    await db.from('orders').delete().eq('id', order.id)
    return NextResponse.json({ error: 'Could not save order items' }, { status: 500 })
  }

  const lineItems = validatedItems.map(item => {
    const unitAmount = Math.round(item.price * 100)
      + (item.extraMeat ? 300 : 0)
      + (item.extraVegetable ? 300 : 0)
      + item.optionExtrasCents
    const description = [
      item.optionSelections ? Object.values(item.optionSelections).flat().filter(Boolean).join(', ') : '',
      item.extraMeat ? '+Extra Meat' : '',
      item.extraVegetable ? '+Extra Vegetable' : '',
      item.flavourSelections
        ? Object.entries(item.flavourSelections).filter(([, q]) => q > 0).map(([f, q]) => `${f} x${q}`).join(', ')
        : '',
      item.notes.trim() ? `Note: ${item.notes.trim()}` : '',
    ].filter(Boolean).join(' | ')
    return {
      price_data: {
        currency: 'aud',
        product_data: { name: item.name, description: description || undefined },
        unit_amount: unitAmount,
      },
      quantity: item.quantity,
    }
  })

  const appUrl = stripBOM(process.env.NEXT_PUBLIC_APP_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'))

  let session: Stripe.Checkout.Session
  try {
    session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: 'payment',
      success_url: `${appUrl}/order/${order.id}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout`,
      metadata: {
        order_id: order.id,
        customer_name: name.trim(),
        customer_phone: normalizedPhone,
        pickup_time: pickupTime,
      },
      phone_number_collection: { enabled: false },
      custom_text: {
        submit: { message: `Pickup only - ${pickupTime === 'asap' ? 'Ready in ~15 min' : pickupTime}` },
      },
    }, idempotencyKey ? { idempotencyKey } : undefined)
  } catch (error) {
    console.error('[Checkout] Stripe session creation failed:', error)
    await db.from('orders').delete().eq('id', order.id)
    return NextResponse.json({ error: 'Could not start payment. Please try again.' }, { status: 502 })
  }

  const { error: updateError } = await db.from('orders').update({ stripe_session_id: session.id }).eq('id', order.id)
  if (updateError) {
    await stripe.checkout.sessions.expire(session.id).catch(() => undefined)
    await db.from('orders').delete().eq('id', order.id)
    return NextResponse.json({ error: 'Could not finalize checkout. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ url: session.url })
}
