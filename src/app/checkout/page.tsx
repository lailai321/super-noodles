'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cart'
import RefundPolicy from '@/components/RefundPolicy'

function getSydneyNow(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Australia/Sydney' }))
}

function getTimeSlots(): string[] {
  const now = getSydneyNow()
  const slots: string[] = []
  const earliest = new Date(now.getTime() + 30 * 60 * 1000)

  const open = new Date(now); open.setHours(11, 0, 0, 0)
  const close = new Date(now); close.setHours(20, 0, 0, 0)

  let t = new Date(Math.max(earliest.getTime(), open.getTime()))
  const mins = t.getMinutes(), rem = mins % 15
  if (rem !== 0) t.setMinutes(mins + (15 - rem), 0, 0)

  while (t <= close) {
    const h = t.getHours(), m = t.getMinutes()
    const ampm = h >= 12 ? 'pm' : 'am'
    const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h
    slots.push(`${h12}:${String(m).padStart(2, '0')}${ampm}`)
    t.setMinutes(t.getMinutes() + 15)
  }
  return slots
}

function isStoreOpen(): boolean {
  const now = getSydneyNow()
  if (now.getDay() === 1) return false
  const mins = now.getHours() * 60 + now.getMinutes()
  return mins >= 11 * 60 && mins < 20 * 60
}

const F = { fontFamily: "'BudgePair', sans-serif" } as const
const R = { fontFamily: "'Rackety DEMO', sans-serif" } as const

export default function CheckoutPage() {
  const router = useRouter()
  const { items, totalCents, clearCart } = useCartStore()
  const [name, setName] = useState(''), [phone, setPhone] = useState('')
  const [pickupType, setPickupType] = useState<'asap' | 'schedule'>(() => isStoreOpen() ? 'asap' : 'schedule')
  const [pickupTime, setPickupTime] = useState(''), [loading, setLoading] = useState(false), [error, setError] = useState('')

  const [idempotencyKey] = useState(() => crypto.randomUUID())
  const [holidayToday, setHolidayToday] = useState(false)

  useEffect(() => {
    fetch('/api/holidays', { cache: 'no-store' })
      .then(r => r.json())
      .then(data => setHolidayToday(Boolean(data.today)))
      .catch(() => {})
  }, [])

  const slots = getTimeSlots(), storeOpen = isStoreOpen(), total = totalCents()

  if (items.length === 0) return (
    <div style={{ minHeight: '100svh', background: '#FFF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <p style={{ ...F, color: '#666' }}>Your cart is empty.</p>
      <a href="/" style={{ ...R, fontSize: '1.1rem', color: '#F3BD25', textDecoration: 'none' }}>← Back to Menu</a>
    </div>
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    if (holidayToday) return setError("We're closed today. See you soon!")
    if (!name.trim() || !phone.trim()) return setError('Please fill in your name and phone.')
    if (pickupType === 'schedule' && !pickupTime) return setError('Please select a pickup time.')
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), pickupTime: pickupType === 'asap' ? 'asap' : pickupTime, items, idempotencyKey }),
      })
      const data = await res.json()
      if (data.url) {
        clearCart()
        window.location.href = data.url
        // 不 setLoading(false)，按钮保持禁用直到页面跳转完成
      } else {
        setError(data.error || 'Something went wrong. Please try again.')
        setLoading(false)
      }
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  const pickupBtn = (active: boolean, disabled: boolean): React.CSSProperties => ({
    flex: 1, padding: '12px', borderRadius: 4,
    border: `2px solid ${active ? '#F3BD25' : '#EEEEEE'}`,
    background: active ? '#F3BD25' : '#FFF',
    color: '#1A1A1A', ...R, fontSize: '1rem', letterSpacing: '0.04em',
    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1, transition: 'all 0.15s',
  })

  const labelS: React.CSSProperties = { ...R, fontSize: '0.9rem', color: '#666', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }

  return (
    <div style={{ background: '#FFF', minHeight: '100svh', padding: '36px 16px 80px' }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <a href="/" style={{ ...F, fontSize: '0.85rem', color: '#666', textDecoration: 'none', display: 'block', marginBottom: 24 }}>← Back to Menu</a>
        <h1 style={{ ...R, fontSize: '2.5rem', color: '#1A1A1A', letterSpacing: '0.06em', marginBottom: 28 }}>Checkout</h1>

        {/* Summary */}
        <div style={{ background: '#F7F7F7', borderRadius: 8, padding: '16px 20px', marginBottom: 24, border: '1px solid #EEEEEE' }}>
          <p style={{ ...F, fontSize: '1rem', color: '#666', marginBottom: 12 }}>ORDER SUMMARY</p>
          {items.map((item, i) => {
            const extras = (item.extraMeat ? 300 : 0) + (item.extraVegetable ? 300 : 0) + (item.optionExtrasCents ?? 0)
            const line = (Math.round(item.price * 100) + extras) * item.quantity
            const optionsSummary = item.optionSelections
              ? Object.values(item.optionSelections).flat().filter(Boolean).join(', ')
              : ''
            const subline = [
              optionsSummary,
              item.extraMeat ? '+Meat' : '',
              item.extraVegetable ? '+Veg' : '',
            ].filter(Boolean).join(', ')
            return (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <span style={{ ...F, fontSize: '0.875rem', color: '#1A1A1A' }}>×{item.quantity} {item.name}</span>
                  {subline && <p style={{ ...F, fontSize: '0.78rem', color: '#999', marginTop: 1 }}>{subline}</p>}
                </div>
                <span style={{ ...F, fontSize: '0.875rem', fontWeight: 700, color: '#1A1A1A', flexShrink: 0 }}>${(line / 100).toFixed(2)}</span>
              </div>
            )
          })}
          <div style={{ borderTop: '1px solid #EEEEEE', marginTop: 12, paddingTop: 12, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ ...F, fontSize: '1rem', fontWeight: 700, color: '#1A1A1A' }}>TOTAL</span>
            <span style={{ ...F, fontSize: '1rem', fontWeight: 700, color: '#1A1A1A' }}>${(total / 100).toFixed(2)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={labelS}>NAME</label>
            <input className="input-dark" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" required />
            <p style={{ ...F, fontSize: '0.72rem', color: '#999', marginTop: 4 }}>Include last name so we can call your order</p>
          </div>
          <div>
            <label style={labelS}>PHONE</label>
            <input className="input-dark" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="04xx xxx xxx" required />
            <p style={{ ...F, fontSize: '0.72rem', color: '#999', marginTop: 4 }}>We&apos;ll send you an SMS when your order is ready for pickup</p>
          </div>
          <div>
            <label style={labelS}>PICKUP TIME</label>
            {!storeOpen && slots.length === 0 ? (
              <div style={{ background: '#FFF8E5', border: '1.5px solid #F3BD25', borderRadius: 8, padding: '12px 16px' }}>
                <p style={{ ...F, fontSize: '0.85rem', color: '#1A1A1A', fontWeight: 700, marginBottom: 4 }}>We&apos;re currently closed</p>
                <p style={{ ...F, fontSize: '0.78rem', color: '#666' }}>Open Tue–Sun 11:00am–8:00pm (Sydney time)</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => setPickupType('asap')} disabled={!storeOpen} style={pickupBtn(pickupType === 'asap', !storeOpen)}>ASAP (~15 min)</button>
                  <button type="button" onClick={() => setPickupType('schedule')} disabled={slots.length === 0} style={pickupBtn(pickupType === 'schedule', slots.length === 0)}>Schedule</button>
                </div>
                {pickupType === 'schedule' && slots.length > 0 && (
                  <select value={pickupTime} onChange={e => setPickupTime(e.target.value)} className="input-dark" style={{ marginTop: 8 }}>
                    <option value="">Select a time…</option>
                    {slots.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                )}
              </>
            )}
          </div>
          {error && (
            <div style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 8, padding: '12px 16px' }}>
              <p style={{ ...F, fontSize: '0.9rem', color: '#DC2626', fontWeight: 700 }}>{error}</p>
            </div>
          )}
          <button type="submit" disabled={loading} className="btn-brand"
            style={{ fontFamily: "'BudgePair', sans-serif", fontSize: '1rem', fontWeight: 700, letterSpacing: 0 }}>
            {loading ? 'Processing…' : `Pay $${(total / 100).toFixed(2)}`}
          </button>
          <p style={{ ...F, textAlign: 'center', fontSize: '0.72rem', color: '#AAA' }}>
            SSL encrypted · Powered by Stripe
          </p>
        </form>

        <RefundPolicy />
      </div>
    </div>
  )
}
