'use client'
import { useEffect, useRef } from 'react'
import { MenuCategory } from '@/types'

interface Props {
  categories: MenuCategory[]
  activeSlug: string
  onSelect: (slug: string) => void
}

export default function CategoryNav({ categories, activeSlug, onSelect }: Props) {
  const navRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = navRef.current
    const el = container?.querySelector(`[data-slug="${activeSlug}"]`) as HTMLElement
    if (!container || !el) return
    const left = el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2
    container.scrollTo({ left: Math.max(0, left), behavior: 'smooth' })
  }, [activeSlug])

  return (
    <div ref={navRef} className="hide-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '10px 14px' }}>
      {categories.map(cat => {
        const active = activeSlug === cat.slug
        return (
          <button
            key={cat.slug}
            data-slug={cat.slug}
            onClick={() => onSelect(cat.slug)}
            style={{
              whiteSpace: 'nowrap', padding: '10px 18px', borderRadius: 4,
              border: 'none',
              background: active ? '#1A1A1A' : '#F3BD25',
              color: active ? '#F3BD25' : '#1A1A1A',
              fontFamily: "'Rackety DEMO', sans-serif",
              fontSize: '1.1rem', letterSpacing: '0.04em',
              cursor: 'pointer', transition: 'background 0.15s', flexShrink: 0,
            }}
          >
            {cat.name}
          </button>
        )
      })}
    </div>
  )
}
