'use client'
import { useState } from 'react'

export default function ReceiptForm({ orderId, stripeSessionId }: { orderId: string; stripeSessionId: string }) {
  const [email, setEmail] = useState(''), [sent, setSent] = useState(false), [loading, setLoading] = useState(false)

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      const response = await fetch('/api/receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, orderId, sessionId: stripeSessionId }),
      })
      if (response.ok) setSent(true)
    } finally { setLoading(false) }
  }

  if (sent) return (
    <p style={{ fontFamily: "'BudgePair', sans-serif", textAlign: 'center', fontSize: '0.875rem', color: '#16a34a' }}>
      Receipt sent to {email} ✓
    </p>
  )

  return (
    <div style={{ background: '#F7F7F7', borderRadius: 8, padding: '16px 20px', border: '1px solid #EEEEEE' }}>
      <p style={{ fontFamily: "'BudgePair', sans-serif", fontSize: '0.875rem', fontWeight: 700, color: '#1A1A1A', marginBottom: 12 }}>
        Want a receipt?
      </p>
      <form onSubmit={handleSend} style={{ display: 'flex', gap: 8 }}>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com" required className="input-dark" style={{ flex: 1 }} />
        <button type="submit" disabled={loading} className="btn-brand" style={{ width: 'auto', padding: '0 20px', fontSize: '1rem' }}>
          {loading ? '…' : 'Send'}
        </button>
      </form>
    </div>
  )
}
