'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ShoppingBag, XCircle, MapPin, Clock, Phone } from 'lucide-react'
import Image from 'next/image'

import { MenuCategory, MenuItem } from '@/types'
import CategoryNav from '@/components/CategoryNav'
import ItemCard from '@/components/ItemCard'
import ItemModal from '@/components/ItemModal'
import { useCartStore } from '@/store/cart'
import PromoBanner from '@/components/PromoBanner'

interface MenuData {
  categories: MenuCategory[]
  soldOut: string[]
  overrides: Record<string, { name?: string; price_cents?: number; description?: string; is_hidden?: boolean }>
}

export default function HomePage() {
  const [isAdminView, setIsAdminView] = useState(false)
  const [data, setData] = useState<MenuData | null>(null)
  const [activeSlug, setActiveSlug] = useState('')
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [holidayStatus, setHolidayStatus] = useState<{ today: boolean; tomorrow: boolean } | null>(null)
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})
  const isScrolling = useRef(false)

  const fetchHolidayStatus = useCallback(() => {
    fetch('/api/holidays', { cache: 'no-store' })
      .then(r => r.json())
      .then(setHolidayStatus)
      .catch(() => setHolidayStatus({ today: false, tomorrow: false }))
  }, [])

  useEffect(() => {
    setIsAdminView(new URLSearchParams(window.location.search).get('admin') === 'true')
    fetch('/api/menu').then(r => r.json()).then(setData)
    fetchHolidayStatus()
    const onVisible = () => { if (document.visibilityState === 'visible') fetchHolidayStatus() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [fetchHolidayStatus])

  useEffect(() => {
    if (!data) return
    setActiveSlug(data.categories[0]?.slug ?? '')
  }, [data])

  useEffect(() => {
    if (!data) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrolling.current) return
        const visible = entries.filter(e => e.isIntersecting)
        if (visible.length > 0) {
          const top = visible.reduce((a, b) => a.boundingClientRect.top < b.boundingClientRect.top ? a : b)
          const slug = (top.target as HTMLElement).dataset.slug
          if (slug) setActiveSlug(slug)
        }
      },
      { threshold: 0.1, rootMargin: '-105px 0px 0px 0px' }
    )
    Object.values(sectionRefs.current).forEach(el => el && observer.observe(el))
    return () => observer.disconnect()
  }, [data])

  function scrollToCategory(slug: string) {
    const el = sectionRefs.current[slug]
    if (!el) return
    setActiveSlug(slug)
    isScrolling.current = true
    const top = el.getBoundingClientRect().top + window.scrollY - 120
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
    setTimeout(() => { isScrolling.current = false }, 1200)
  }

  if (!data) return (
    <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFFFF' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #EEEEEE', borderTopColor: '#F3BD25', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  const isSearching = searchQuery.trim().length > 0

  return (
    <div style={{ background: '#FFFFFF', minHeight: '100svh' }}>

      {/* Admin back button */}
      {isAdminView && (
        <div style={{ background: '#1A1A1A', padding: '10px 20px' }}>
          <a
            href="/admin"
            style={{
              color: '#FFC200',
              fontFamily: "'BudgePair', sans-serif",
              fontWeight: 700,
              fontSize: '0.9rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            ← Back to Admin
          </a>
        </div>
      )}

      {!holidayStatus?.today && holidayStatus?.tomorrow && (
        <div style={{
          background: '#1A1A1A',
          color: '#FFC200',
          textAlign: 'center',
          padding: '13px 20px',
          fontFamily: "'BudgePair', sans-serif",
          fontWeight: 700,
          fontSize: '0.95rem',
          lineHeight: 1.5,
        }}>
          We&apos;ll be closed tomorrow. Order today!
          {' '}<span style={{ opacity: 0.65, fontWeight: 400 }}>明日休息，欢迎今天提前点餐！</span>
        </div>
      )}

      {/* Hero */}
      <div className="hero-wrapper">
        <Image src="/banner.jpg" alt="Super Noodles" fill style={{ objectFit: 'cover', objectPosition: 'center' }} priority unoptimized />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 20%, rgba(0,0,0,0.6) 100%)', zIndex: 1 }} />
        {holidayStatus?.today && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.6)', zIndex: 2 }} />
        )}
        <div className="hero-mobile-overlay" />

        {/* Text overlay */}
        <div className="hero-content">
          <h1 className="hero-title">Super Noodles – Glenmore Park</h1>
          <div className="hero-info">
            <span className="hero-info-item"><MapPin size={15} strokeWidth={2.2} className="hero-info-icon" />Kiosk 2 Glenmore Park Town Centre, 1/11 Town Terrace, Glenmore Park NSW 2745</span>
            <span className="hero-sep">·</span>
            <span className="hero-info-item"><Clock size={15} strokeWidth={2.2} className="hero-info-icon" />Tue–Sun 11:00am – 8:00pm</span>
            <span className="hero-sep">·</span>
            <span className="hero-info-item"><Phone size={15} strokeWidth={2.2} className="hero-info-icon" />(02) 4733 4782</span>
          </div>
          <div className="hero-tags" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#F3BD25', color: '#1A1A1A', fontFamily: "'BudgePair', sans-serif", fontSize: '1rem', fontWeight: 700, padding: '7px 16px', borderRadius: 6, letterSpacing: '0.02em' }}>
              <ShoppingBag size={17} strokeWidth={2.2} />
              Pick Up Only
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#DC2626', color: '#FFFFFF', fontFamily: "'BudgePair', sans-serif", fontSize: '1rem', fontWeight: 700, padding: '7px 16px', borderRadius: 6 }}>
              <XCircle size={17} strokeWidth={2.2} />
              Delivery Unavailable
            </span>
          </div>
        </div>
      </div>

      {/* Coupon cards — below the hero photo, never overlapping it */}
      <div className="hero-coupons">
        <PromoBanner />
      </div>

      {/* Mobile sticky category nav — full width, outside padded container */}
      <div className="mobile-cat-sticky">
        <CategoryNav
          categories={data.categories}
          activeSlug={activeSlug}
          onSelect={(slug) => { setSearchQuery(''); scrollToCategory(slug) }}
        />
      </div>

      {/* Main content — padded */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 28px' }}>
        <div className="page-body">

          {/* Left sidebar */}
          <aside className="cat-sidebar">
            {data.categories.map(cat => {
              const visible = cat.items.filter(item => !data.overrides[item.uuid]?.is_hidden)
              if (!visible.length) return null
              return (
                <button
                  key={cat.slug}
                  className={`cat-sidebar-btn${activeSlug === cat.slug ? ' active' : ''}`}
                  onClick={() => { setSearchQuery(''); scrollToCategory(cat.slug) }}
                >
                  {cat.name}
                </button>
              )
            })}
          </aside>

          {/* Main content */}
          <main className="menu-main">

            {/* Search box */}
            <div style={{ position: 'relative', marginBottom: 24 }}>
              <svg
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#999' }}
                width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              >
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search menu..."
                style={{
                  width: '100%', padding: '11px 16px 11px 44px',
                  borderRadius: 8, border: '1px solid #DDDDDD',
                  background: '#FFFFFF', fontFamily: "'BudgePair', sans-serif",
                  fontSize: '0.9rem', color: '#1A1A1A', outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.target.style.borderColor = '#F3BD25')}
                onBlur={e => (e.target.style.borderColor = '#DDDDDD')}
              />
              {isSearching && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: '1.1rem', lineHeight: 1,
                  }}
                >✕</button>
              )}
            </div>

            {/* Menu sections */}
            {data.categories.map(cat => {
              const allItems = cat.items
                .filter(item => !data.overrides[item.uuid]?.is_hidden)
                .map(item => {
                  const ov = data.overrides[item.uuid]
                  return {
                    ...item,
                    name: ov?.name ?? item.name,
                    price: ov?.price_cents != null ? ov.price_cents / 100 : item.price,
                    description: ov?.description ?? item.description,
                  }
                })

              const visible = isSearching
                ? allItems.filter(item => {
                    const q = searchQuery.toLowerCase()
                    return item.name.toLowerCase().includes(q) ||
                      (item.description?.toLowerCase().includes(q) ?? false)
                  })
                : allItems

              if (!visible.length) return null

              return (
                <section
                  key={cat.slug}
                  data-slug={cat.slug}
                  ref={el => { sectionRefs.current[cat.slug] = el }}
                  style={{ scrollMarginTop: 120 }}
                >
                  <h2 className="cat-section-title">{cat.name}</h2>
                  <div className="item-grid">
                    {visible.map(item => (
                      <ItemCard
                        key={item.uuid}
                        item={item}
                        isSoldOut={data.soldOut.includes(item.uuid)}
                        onClick={() => setSelectedItem(item)}
                      />
                    ))}
                  </div>
                </section>
              )
            })}

            {/* No results */}
            {isSearching && data.categories.every(cat => {
              const q = searchQuery.toLowerCase()
              return !cat.items.filter(item => !data.overrides[item.uuid]?.is_hidden).some(item => {
                const ov = data.overrides[item.uuid]
                const name = ov?.name ?? item.name
                const desc = ov?.description ?? item.description
                return name.toLowerCase().includes(q) || (desc?.toLowerCase().includes(q) ?? false)
              })
            }) && (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999', fontFamily: "'BudgePair', sans-serif" }}>
                <p style={{ fontSize: '1rem', marginBottom: 8 }}>No items found for &quot;{searchQuery}&quot;</p>
                <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', color: '#F3BD25', cursor: 'pointer', fontFamily: "'BudgePair', sans-serif", fontSize: '0.9rem', textDecoration: 'underline' }}>
                  Clear search
                </button>
              </div>
            )}

          </main>
        </div>
      </div>

      <ItemModal item={selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  )
}
