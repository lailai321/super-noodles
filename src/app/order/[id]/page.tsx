import { notFound } from 'next/navigation'
import Link from 'next/link'
import Stripe from 'stripe'
import { getServiceClient } from '@/lib/supabase'
import ReceiptForm from './ReceiptForm'
import RefundPolicy from '@/components/RefundPolicy'

const stripBOM = (s: string) => s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s
const stripe = new Stripe(stripBOM(process.env.STRIPE_SECRET_KEY!))

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ session_id?: string }>
}

export default async function OrderPage({ params, searchParams }: Props) {
  const { id } = await params
  const { session_id } = await searchParams
  if (!session_id) notFound()
  const db = getServiceClient()

  const { data: order } = await db.from('orders').select('*, order_items(*)').eq('id', id).single()
  if (!order || order.stripe_session_id !== session_id) notFound()

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id)
    if (
      session.payment_status !== 'paid'
      || session.metadata?.order_id !== id
      || session.amount_total !== order.total_cents
    ) notFound()
  } catch {
    notFound()
  }

  const pickupLabel = order.pickup_time === 'asap' ? '~15 minutes (ASAP)' : order.pickup_time
  const R = { fontFamily: "'Rackety DEMO', sans-serif" } as const
  const F = { fontFamily: "'BudgePair', sans-serif" } as const
  const status = {
    confirmed: { title: 'Order Confirmed!', detail: "We're preparing your order", color: '#D9A815' },
    ready: { title: 'Ready for Pickup!', detail: 'Your order is ready at the counter', color: '#16A34A' },
    collected: { title: 'Order Collected', detail: 'Thank you for ordering with us', color: '#666666' },
  }[order.status as 'confirmed' | 'ready' | 'collected'] ?? {
    title: 'Order Confirmed!',
    detail: "We're preparing your order",
    color: '#D9A815',
  }

  return (
    <div style={{ background: '#FFF', minHeight: '100svh', padding: '48px 16px 80px' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>

        {/* Confirmation */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ marginBottom: 16 }}>
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#F3BD25" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block' }}>
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h1 style={{ ...R, fontSize: '2.2rem', color: '#1A1A1A', letterSpacing: '0.06em', marginBottom: 4 }}>{status.title}</h1>
          <p style={{ ...F, fontSize: '0.95rem', color: status.color, fontWeight: 700, marginBottom: 6 }}>{status.detail}</p>
          <p style={{ ...R, fontSize: '1.4rem', color: status.color, letterSpacing: '0.06em' }}>
            #{String(order.order_number).padStart(4, '0')}
          </p>
        </div>

        {/* Items */}
        <div style={{ background: '#F7F7F7', borderRadius: 8, border: '1px solid #EEEEEE', overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ padding: '16px 20px' }}>
            {order.order_items.map((item: {
              id: string; quantity: number; item_name: string
              extra_meat: boolean; extra_vegetable: boolean; notes: string; unit_price_cents: number
            }) => {
              const extras = (item.extra_meat ? 300 : 0) + (item.extra_vegetable ? 300 : 0)
              const line = (item.unit_price_cents + extras) * item.quantity
              return (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <span style={{ ...F, fontSize: '0.875rem', color: '#1A1A1A' }}>×{item.quantity} {item.item_name}</span>
                    {item.extra_meat && <span style={{ ...F, fontSize: '0.72rem', color: '#666' }}> +Meat</span>}
                    {item.extra_vegetable && <span style={{ ...F, fontSize: '0.72rem', color: '#666' }}> +Veg</span>}
                    {item.notes && <p style={{ ...F, fontSize: '0.72rem', color: '#999', fontStyle: 'italic' }}>{item.notes}</p>}
                  </div>
                  <span style={{ ...F, fontSize: '0.875rem', fontWeight: 700, color: '#1A1A1A' }}>${(line / 100).toFixed(2)}</span>
                </div>
              )
            })}
          </div>
          <div style={{ borderTop: '1px solid #EEEEEE', padding: '12px 20px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ ...R, fontSize: '1rem', color: '#1A1A1A', letterSpacing: '0.04em' }}>TOTAL</span>
            <span style={{ ...R, fontSize: '1.1rem', color: '#1A1A1A', letterSpacing: '0.04em' }}>${(order.total_cents / 100).toFixed(2)}</span>
          </div>
        </div>

        {/* Pickup info */}
        <div style={{ background: '#F7F7F7', borderRadius: 8, border: '1px solid #EEEEEE', padding: '16px 20px', marginBottom: 16 }}>
          {[
            { icon: '🕐', label: 'Pickup Time', value: pickupLabel },
            { icon: '📍', label: 'Pickup Location', value: 'Kiosk 2, 1/11 Town Terrace\nGlenmore Park NSW 2745' },
          ].map(({ icon, label, value }) => (
            <div key={label} style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
              <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{icon}</span>
              <div>
                <p style={{ ...F, fontWeight: 700, fontSize: '0.85rem', color: '#1A1A1A', marginBottom: 2 }}>{label}</p>
                <p style={{ ...F, fontSize: '0.85rem', color: '#666', whiteSpace: 'pre-line' }}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        <ReceiptForm orderId={order.id} stripeSessionId={order.stripe_session_id} />
        <RefundPolicy />

        <p style={{ ...F, textAlign: 'center', fontSize: '0.75rem', color: '#999', marginTop: 20 }}>
          Need to check this later?{' '}
          <a href="/track" style={{ color: '#F3BD25', textDecoration: 'none' }}>Track your order</a>
        </p>
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <Link href="/" style={{ ...R, fontSize: '1rem', color: '#1A1A1A', textDecoration: 'none', letterSpacing: '0.04em' }}>Order Again</Link>
        </div>
      </div>
    </div>
  )
}
