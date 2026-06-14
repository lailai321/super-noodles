'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCartStore } from '@/store/cart'

const NAV_LINKS = [
  { label: 'Menu', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Catering', href: '/catering' },
  { label: 'Track Order', href: '/track' },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [holidayToday, setHolidayToday] = useState(false)
  const pathname = usePathname()
  const count = useCartStore(s => s.items.reduce((sum, i) => sum + i.quantity, 0))
  const openCart = useCartStore(s => s.openCart)

  useEffect(() => {
    const fetchHoliday = () => {
      fetch('/api/holidays', { cache: 'no-store' })
        .then(r => r.json())
        .then(d => {
          const closed = Boolean(d.today)
          setHolidayToday(closed)
          document.body.classList.toggle('holiday-day', closed)
        })
        .catch(() => {})
    }
    fetchHoliday()
    const onVisible = () => { if (document.visibilityState === 'visible') fetchHoliday() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { document.removeEventListener('visibilitychange', onVisible) }
  }, [])

  return (
    <>
      <nav className="main-nav" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: '#1A1A1A',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px',
      }}>
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo_final.svg" alt="Super Noodles" className="nav-logo" style={{ width: 'auto', display: 'block' }} />
        </Link>

        {/* Desktop nav links */}
        <div className="desktop-nav">
          {NAV_LINKS.map(({ label, href }) => {
            const active = pathname === href
            return (
              <Link key={href} href={href} style={{
                fontFamily: "'BudgePair', sans-serif",
                fontSize: '16px', letterSpacing: '0.02em',
                color: active ? '#F3BD25' : '#FFFFFF',
                textDecoration: 'none', transition: 'color 0.15s',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#F3BD25' }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#FFFFFF' }}
              >
                {label}
              </Link>
            )
          })}
        </div>

        {/* Right: cart + hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          {/* Cart — desktop only (mobile uses bottom bar) */}
          <button onClick={openCart} className="nav-cart-btn" style={{
            background: 'none', border: 'none', cursor: 'pointer',
            position: 'relative', padding: 4, color: '#F3BD25',
            display: 'flex', alignItems: 'center',
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            {count > 0 && (
              <span style={{
                position: 'absolute', top: -2, right: -6,
                background: '#F3BD25', color: '#1A1A1A',
                borderRadius: '50%', width: 18, height: 18,
                fontSize: 11, fontWeight: 700,
                fontFamily: "'BudgePair', sans-serif",
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {count}
              </span>
            )}
          </button>

          {/* Hamburger - mobile only */}
          <button
            onClick={() => setMobileOpen(v => !v)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FFFFFF', padding: 4, display: 'flex', alignItems: 'center' }}
            className="hamburger-btn"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {mobileOpen
                ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
              }
            </svg>
          </button>
        </div>
      </nav>

      {/* Holiday closed banner */}
      {holidayToday && (
        <div className="holiday-banner">
          We&apos;re closed today — See you next time!
        </div>
      )}

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="mobile-dropdown" style={{
          position: 'fixed', left: 0, right: 0, zIndex: 99,
          background: '#1A1A1A', borderBottom: '1px solid #333',
          padding: '8px 0',
        }}>
          {NAV_LINKS.map(({ label, href }) => (
            <Link key={href} href={href}
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'block', padding: '14px 24px',
                fontFamily: "'BudgePair', sans-serif",
                fontSize: 20, letterSpacing: '0.01em',
                color: pathname === href ? '#F3BD25' : '#FFFFFF',
                textDecoration: 'none',
                borderBottom: '1px solid #2A2A2A',
              }}
            >
              {label}
            </Link>
          ))}
        </div>
      )}

      <style>{`
        /* Desktop */
        .main-nav { height: 100px; }
        .nav-logo { height: 90px; max-width: 240px; }
        .desktop-nav { display: flex; gap: 36px; align-items: center; }
        .hamburger-btn { display: none; }
        .mobile-dropdown { top: 100px; }
        .holiday-banner {
          position: fixed; top: 100px; left: 0; right: 0; z-index: 99;
          background: #1A1A1A; border-bottom: 2px solid #FFC200;
          color: #FFC200; text-align: center;
          padding: 13px 20px;
          font-family: 'BudgePair', sans-serif; font-weight: 700;
          font-size: 1.1rem; letter-spacing: 0.02em;
        }
        body.holiday-day .main-content { padding-top: 152px !important; }

        /* Mobile */
        @media (max-width: 768px) {
          .main-nav { height: 64px; padding: 0 16px; }
          .nav-logo { height: 42px; max-width: 140px; }
          .desktop-nav { display: none; }
          .hamburger-btn { display: flex; }
          .mobile-dropdown { top: 64px; }
          .holiday-banner { top: 64px; font-size: 0.95rem; padding: 11px 16px; }
          body.holiday-day .main-content { padding-top: 116px !important; }
        }
      `}</style>
    </>
  )
}
