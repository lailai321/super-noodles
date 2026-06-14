'use client'
import Image from 'next/image'
import { MenuItem } from '@/types'

interface Props {
  item: MenuItem
  isSoldOut: boolean
  onClick: () => void
}

export default function ItemCard({ item, isSoldOut, onClick }: Props) {
  return (
    <div
      onClick={isSoldOut ? undefined : onClick}
      style={{
        background: '#FFFFFF', borderRadius: 8,
        border: '1px solid #EEEEEE',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        padding: '14px 14px 26px 14px',
        display: 'flex', gap: 12,
        cursor: isSoldOut ? 'not-allowed' : 'pointer',
        opacity: isSoldOut ? 0.55 : 1,
        transition: 'box-shadow 0.15s',
        position: 'relative',
      }}
      onMouseEnter={e => { if (!isSoldOut) (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(0,0,0,0.13)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)' }}
    >
      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: "'BudgePair', sans-serif", fontWeight: 700, fontSize: '1rem', color: '#1A1A1A', lineHeight: 1.35, marginBottom: 6 }}>
          {item.name}
        </p>
        {item.description && (
          <p style={{
            fontFamily: "'BudgePair', sans-serif", fontSize: '0.8rem', color: '#666666', lineHeight: 1.5, marginBottom: 8,
            overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
          }}>
            {item.description}
          </p>
        )}
        <p style={{ fontFamily: "'BudgePair', sans-serif", fontWeight: 700, fontSize: '0.95rem', color: '#1A1A1A' }}>
          ${item.price.toFixed(2)}
          {isSoldOut && (
            <span style={{ marginLeft: 8, fontSize: 11, padding: '2px 7px', borderRadius: 3, background: '#F5F5F5', color: '#999', border: '1px solid #E5E5E5' }}>
              Sold Out
            </span>
          )}
        </p>
      </div>

      {/* Image + add button */}
      {item.imageUrl ? (
        <div style={{ position: 'relative', flexShrink: 0, paddingRight: 14, paddingBottom: 14 }}>
          <div style={{ width: 100, height: 100, borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
            <Image src={item.imageUrl} alt={item.name} fill style={{ objectFit: 'cover' }} sizes="100px" unoptimized />
          </div>
          {!isSoldOut && (
            <button
              onClick={e => { e.stopPropagation(); onClick() }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              style={{
                position: 'absolute', right: 0, bottom: 0,
                width: 40, height: 40, borderRadius: '50%',
                background: '#F3BD25', color: '#1A1A1A',
                border: 'none', fontSize: '1.6rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                transition: 'transform 0.15s', lineHeight: 1,
              }}
            >+</button>
          )}
        </div>
      ) : (
        !isSoldOut && (
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'flex-end', paddingBottom: 0 }}>
            <button
              onClick={e => { e.stopPropagation(); onClick() }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              style={{
                width: 40, height: 40, borderRadius: '50%',
                background: '#F3BD25', color: '#1A1A1A',
                border: 'none', fontSize: '1.6rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                transition: 'transform 0.15s', lineHeight: 1, flexShrink: 0,
              }}
            >+</button>
          </div>
        )
      )}
    </div>
  )
}
