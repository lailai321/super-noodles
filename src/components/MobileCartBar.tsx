'use client'
import { useState, useEffect } from 'react'
import { useCartStore } from '@/store/cart'

export default function MobileCartBar() {
  const count = useCartStore(s => s.items.reduce((sum, i) => sum + i.quantity, 0))
  const totalCents = useCartStore(s => s.items.reduce((sum, i) => {
    const extras = (i.extraMeat ? 300 : 0) + (i.extraVegetable ? 300 : 0) + (i.optionExtrasCents ?? 0)
    return sum + (Math.round(i.price * 100) + extras) * i.quantity
  }, 0))
  const openCart = useCartStore(s => s.openCart)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  if (!isMobile || count === 0) return null

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      padding: '10px 16px 28px',
      background: 'linear-gradient(to top, rgba(255,255,255,1) 55%, transparent)',
      zIndex: 95,
    }}>
      <button
        onClick={openCart}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          background: '#1A1A1A', color: '#FFFFFF',
          border: 'none', borderRadius: 50,
          padding: '15px 22px',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F3BD25" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 01-8 0"/>
        </svg>
        <span style={{ flex: 1, textAlign: 'left', fontFamily: "'BudgePair', sans-serif", fontWeight: 700, fontSize: '1rem' }}>
          View Cart
        </span>
        <span style={{
          background: '#F3BD25', color: '#1A1A1A', borderRadius: 50,
          minWidth: 26, height: 26, padding: '0 8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'BudgePair', sans-serif", fontWeight: 700, fontSize: '0.85rem',
        }}>
          {count}
        </span>
        <span style={{ fontFamily: "'BudgePair', sans-serif", fontWeight: 700, fontSize: '1rem', marginLeft: 4 }}>
          ${(totalCents / 100).toFixed(2)}
        </span>
      </button>
    </div>
  )
}
