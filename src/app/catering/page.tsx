'use client'
import { useState } from 'react'

const R = { fontFamily: "'Rackety DEMO', sans-serif" } as const
const F = { fontFamily: "'BudgePair', sans-serif" } as const

const inputStyle: React.CSSProperties = {
  ...F, background: '#FFF', border: '1px solid #DDDDDD', borderRadius: 4,
  padding: '12px 16px', color: '#1A1A1A', fontSize: '0.9rem', width: '100%', outline: 'none',
}

export default function CateringPage() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', date: '', time: '', guests: '', message: '' })
  const [sent, setSent] = useState(false), [loading, setLoading] = useState(false), [error, setError] = useState('')

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const res = await fetch('/api/catering', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (res.ok) setSent(true)
      else setError('Something went wrong. Please call us at (02) 4733 4782.')
    } catch { setError('Network error. Please call us at (02) 4733 4782.') }
    finally { setLoading(false) }
  }

  const labelS: React.CSSProperties = { ...R, fontSize: '0.85rem', color: '#666', display: 'block', marginBottom: 6, letterSpacing: '0.05em' }
  const focusYellow = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => (e.target.style.borderColor = '#F3BD25')
  const blurGray = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => (e.target.style.borderColor = '#DDDDDD')

  return (
    <div style={{ background: '#FFF', minHeight: '100svh', padding: '48px 16px 80px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <h1 style={{ ...R, fontSize: '2.8rem', color: '#1A1A1A', letterSpacing: '0.06em', marginBottom: 8 }}>
          Catering Services
        </h1>
        <p style={{ ...F, fontSize: '0.9rem', color: '#666', marginBottom: 28 }}>
          Hosting a party or event? We offer custom catering for any occasion.
        </p>

        <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { icon: '✓', text: 'Discounted pricing available' },
            { icon: '⚠', text: 'Please enquire 3–5 business days in advance' },
          ].map(({ icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: '#F3BD25', fontWeight: 700, fontSize: '1.2rem', width: 24, flexShrink: 0 }}>{icon}</span>
              <span style={{ ...F, fontSize: '0.9rem', color: '#1A1A1A' }}>{text}</span>
            </div>
          ))}
        </div>

        {sent ? (
          <div style={{ background: '#F7F7F7', borderRadius: 12, padding: '48px 32px', textAlign: 'center', border: '1px solid #EEEEEE' }}>
            <p style={{ ...R, fontSize: '2rem', color: '#1A1A1A', letterSpacing: '0.06em', marginBottom: 8 }}>Enquiry Received!</p>
            <p style={{ ...F, fontSize: '0.9rem', color: '#666', marginBottom: 24 }}>We'll be in touch within 1 business day.</p>
            <a href="/" style={{ ...R, fontSize: '1.1rem', color: '#F3BD25', textDecoration: 'none', letterSpacing: '0.04em' }}>Back to Menu</a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ background: '#F7F7F7', borderRadius: 12, padding: '28px 24px', border: '1px solid #EEEEEE', display: 'flex', flexDirection: 'column', gap: 18 }}>
            {[
              { label: 'YOUR NAME', key: 'name', type: 'text', placeholder: 'Full name', required: true },
              { label: 'PHONE', key: 'phone', type: 'tel', placeholder: '04xx xxx xxx', required: true },
              { label: 'EMAIL (OPTIONAL)', key: 'email', type: 'email', placeholder: 'your@email.com', required: false },
              { label: 'EVENT DATE', key: 'date', type: 'date', placeholder: '', required: true },
              { label: 'EVENT TIME', key: 'time', type: 'time', placeholder: '', required: true },
            ].map(({ label, key, type, placeholder, required }) => (
              <div key={key}>
                <label style={labelS}>{label}</label>
                <input type={type} value={form[key as keyof typeof form]} onChange={set(key)}
                  placeholder={placeholder} required={required} style={inputStyle}
                  onFocus={focusYellow} onBlur={blurGray} />
              </div>
            ))}
            <div>
              <label style={labelS}>NUMBER OF GUESTS</label>
              <select value={form.guests} onChange={set('guests')} required style={{ ...inputStyle, background: '#FFF' }}
                onFocus={focusYellow} onBlur={blurGray}>
                <option value="">Select…</option>
                {['10–15', '15–20', '20–30', '30–50', '50+'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={labelS}>ADDITIONAL NOTES</label>
              <textarea value={form.message} onChange={set('message')} rows={3}
                placeholder="Type of event, dietary requirements, specific dishes…"
                style={{ ...inputStyle, resize: 'none' }} onFocus={focusYellow} onBlur={blurGray} />
            </div>
            {error && <p style={{ ...F, fontSize: '0.85rem', color: '#ef4444' }}>{error}</p>}
            <button type="submit" disabled={loading} className="btn-brand">
              {loading ? 'Sending…' : 'Submit Enquiry'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
