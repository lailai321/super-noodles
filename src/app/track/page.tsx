'use client'

import { useCallback, useEffect, useState } from 'react'

interface OrderSummary {
  id: string
  order_number: number
  total_cents: number
  pickup_time: string
  status: 'confirmed' | 'ready' | 'collected'
  created_at: string
  order_items: { item_name: string; quantity: number }[]
}

const R = { fontFamily: "'Rackety DEMO', sans-serif" } as const
const F = { fontFamily: "'BudgePair', sans-serif" } as const

const STATUS = {
  confirmed:  { label: "We're preparing your order",     color: '#9A6700', background: '#FFF7D6' },
  ready:      { label: 'Your order is Ready for Pickup!', color: '#166534', background: '#DCFCE7' },
  completed:  { label: 'Order Completed',                 color: '#555555', background: '#F1F1F1' },
}

function resolveStatus(order: OrderSummary) {
  const ageHours = (Date.now() - new Date(order.created_at).getTime()) / 3_600_000
  if (ageHours > 6) return STATUS.completed
  if (order.status === 'ready') return STATUS.ready
  return STATUS.confirmed
}

export default function TrackPage() {
  const [phone, setPhone] = useState('')
  const [searchedPhone, setSearchedPhone] = useState('')
  const [orders, setOrders] = useState<OrderSummary[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchOrders = useCallback(async (value: string, quiet = false) => {
    if (!quiet) setLoading(true)
    try {
      const res = await fetch(`/api/track?phone=${encodeURIComponent(value)}`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not load orders')
      setOrders(data.orders)
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load orders')
    } finally {
      if (!quiet) setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!searchedPhone) return
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void fetchOrders(searchedPhone, true)
    }, 15000)
    const onVisible = () => {
      if (document.visibilityState === 'visible') void fetchOrders(searchedPhone, true)
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [fetchOrders, searchedPhone])

  function handleSearch(event: React.FormEvent) {
    event.preventDefault()
    const value = phone.trim()
    setSearchedPhone(value)
    void fetchOrders(value)
  }

  return (
    <div style={{ background: '#FFF', minHeight: '100svh', padding: '56px 16px 80px' }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <h1 style={{ ...R, fontSize: 'clamp(2.4rem, 10vw, 3rem)', color: '#1A1A1A', letterSpacing: '0.06em', textAlign: 'center', marginBottom: 8 }}>
          Track Your Order
        </h1>
        <p style={{ ...F, fontSize: '0.95rem', color: '#666', textAlign: 'center', marginBottom: 32 }}>
          Enter the mobile number used for your order.
        </p>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <label htmlFor="track-phone" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
            Mobile number
          </label>
          <input
            id="track-phone"
            className="input-dark"
            type="tel"
            value={phone}
            onChange={event => setPhone(event.target.value)}
            placeholder="04xx xxx xxx"
            required
            style={{ flex: 1, minWidth: 0, fontSize: 16 }}
          />
          <button type="submit" disabled={loading} className="btn-brand" style={{ width: 'auto', minWidth: 100, padding: '0 20px', fontSize: '1rem' }}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
        {searchedPhone && orders && (
          <p style={{ ...F, fontSize: '0.75rem', color: '#888', textAlign: 'center', marginBottom: 28 }}>
            Status updates automatically every 15 seconds.
          </p>
        )}
        {error && <p style={{ ...F, color: '#B91C1C', textAlign: 'center', margin: '24px 0' }}>{error}</p>}

        {orders !== null && orders.length === 0 && (
          <p style={{ ...F, textAlign: 'center', color: '#777', padding: '40px 0' }}>
            No recent orders found for this number.
          </p>
        )}

        {orders && orders.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {orders.map(order => {
              const ageHours = (Date.now() - new Date(order.created_at).getTime()) / 3_600_000
              const status = resolveStatus(order)
              return (
                <article key={order.id} style={{
                  background: '#FFF',
                  borderRadius: 10,
                  padding: '18px 20px',
                  border: order.status === 'ready' && ageHours <= 6 ? '2px solid #22C55E' : '1px solid #E5E5E5',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                    <div>
                      <h2 style={{ ...R, fontSize: '1.35rem', color: '#1A1A1A', letterSpacing: '0.04em' }}>
                        Order #{String(order.order_number).padStart(4, '0')}
                      </h2>
                      <p style={{ ...F, fontSize: '0.78rem', color: '#777', marginTop: 3 }}>
                        {new Date(order.created_at).toLocaleString('en-AU', {
                          timeZone: 'Australia/Sydney',
                          day: 'numeric',
                          month: 'short',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <strong style={{
                      ...F,
                      fontSize: '0.78rem',
                      color: status.color,
                      background: status.background,
                      padding: '7px 10px',
                      borderRadius: 6,
                      textAlign: 'center',
                    }}>
                      {status.label}
                    </strong>
                  </div>

                  <p style={{ ...F, fontSize: '0.9rem', color: '#333', lineHeight: 1.5, marginBottom: 10 }}>
                    {order.order_items.map(item => `${item.quantity} × ${item.item_name}`).join(', ')}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, borderTop: '1px solid #EEE', paddingTop: 10 }}>
                    <span style={{ ...F, fontSize: '0.85rem', color: '#666' }}>
                      Pickup: {order.pickup_time === 'asap' ? 'ASAP' : order.pickup_time}
                    </span>
                    <strong style={{ ...F, fontSize: '0.95rem', color: '#1A1A1A' }}>
                      ${(order.total_cents / 100).toFixed(2)}
                    </strong>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
