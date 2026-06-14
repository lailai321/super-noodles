'use client'
import Image from 'next/image'
import { Utensils, Leaf, Users } from 'lucide-react'

const R = { fontFamily: "'Rackety DEMO', sans-serif" } as const
const F = { fontFamily: "'BudgePair', sans-serif" } as const

const locations = [
  {
    name: 'Super Noodles – Glenmore Park',
    address: 'Kiosk 2, Glenmore Park Town Centre\n1/11 Town Terrace, Glenmore Park NSW 2745',
    phone: '(02) 4733 4782',
    hours: 'Tue–Sun 11:00am–8:00pm · Mon Closed',
    hasOrder: true,
    image: '/glenmore-park.jpg',
    imgPosition: 'right top',
  },
  {
    name: 'Super Noodles – Burwood',
    address: 'Westfield Burwood, Shop FC3\nLevel 1/100 Burwood Rd, Burwood NSW 2134',
    phone: 'TBC',
    hours: 'Mon–Wed, Fri–Sun 9:00am–6:00pm · Thu 9:00am–9:00pm',
    hasOrder: false,
    image: '/burwood-store.jpg',
    imgPosition: 'right top',
  },
  {
    name: 'Super Noodles – Campbelltown',
    address: 'Campbelltown Mall\n271 Queen St, Campbelltown NSW 2560',
    phone: 'TBC',
    hours: 'Mon–Wed, Fri–Sun 9:00am–6:00pm · Thu 9:00am–9:00pm',
    hasOrder: false,
    image: '/campbelltown-store.jpg',
    imgPosition: 'right top',
  },
]

const sellingPoints = [
  { icon: <Utensils size={22} color="#F3BD25" strokeWidth={1.8} />, label: 'Cantonese & Malaysian' },
  { icon: <Leaf size={22} color="#F3BD25" strokeWidth={1.8} />, label: 'Fresh & Wholesome' },
  { icon: <Users size={22} color="#F3BD25" strokeWidth={1.8} />, label: 'Family Owned Since 2001' },
]

const storyParagraphs = [
  `Super Noodles began in 2001 as a humble family kitchen in Western Sydney, founded by a first-generation immigrant family who brought with them recipes from across the Cantonese and Malaysian kitchens they grew up in.`,
  `From hand-folded dumplings and stir-fried rice noodles to fragrant laksa and Hokkien noodles, our menu celebrates the rich crossover of Southern Chinese and Southeast Asian cooking — the kind of food our family has always gathered around the table to share.`,
  `What started as a single noodle shop has grown into one of Sydney's most loved Asian restaurant brands, but our heart has never changed. Every broth is still simmered for hours, every dish still made the way our family always has.`,
  `We believe great food should be honest food: fresh ingredients, authentic flavours, and no shortcuts. For over twenty years, from our kitchen to your table, we've been proud to share a taste of home with the community that has supported us every step of the way.`,
]

export default function AboutPage() {
  return (
    <div style={{ background: '#FFF', minHeight: '100svh' }}>

      {/* Hero */}
      <div style={{ background: '#FFFFFF', padding: '56px 24px 40px', textAlign: 'center', width: '100%' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h1 style={{ ...R, fontSize: 'clamp(48px, 8vw, 80px)', color: '#1A1A1A', letterSpacing: '0.06em', lineHeight: 1.1, marginBottom: 12 }}>
            Super Noodles
          </h1>
          <p style={{ ...F, fontSize: '1rem', color: '#666666', letterSpacing: '0.04em' }}>
            From Our Family Kitchen to Yours
          </p>
        </div>
      </div>

      {/* Story + Images side by side */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 28px 56px' }}>

        {/* Section heading */}
        <div style={{ background: '#F3BD25', display: 'inline-block', padding: '10px 20px', borderRadius: 4, marginBottom: 32 }}>
          <h2 style={{ ...R, fontSize: '1.6rem', color: '#1A1A1A', letterSpacing: '0.04em', margin: 0 }}>Our Story</h2>
        </div>

        {/* Two-column: text left, images right */}
        <div className="story-grid">
          {/* Text */}
          <div className="story-text">
            {storyParagraphs.map((para, i) => (
              <p key={i} style={{ ...F, fontSize: '0.95rem', color: '#1A1A1A', lineHeight: 1.9, marginBottom: 24 }}>
                {para}
              </p>
            ))}
          </div>

          {/* Images */}
          <div className="story-images" style={{ display: 'flex', flexDirection: 'column', gap: 22, paddingTop: 0 }}>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', borderRadius: 16, overflow: 'hidden' }}>
              <Image src="/about-img1.webp" alt="Our food" fill style={{ objectFit: 'cover' }} unoptimized />
            </div>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', borderRadius: 16, overflow: 'hidden' }}>
              <Image src="/about-img2.webp" alt="Our kitchen" fill style={{ objectFit: 'cover' }} unoptimized />
            </div>
          </div>
        </div>

        {/* Selling points */}
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 16, marginTop: 40 }}>
          {sellingPoints.map(({ icon, label }) => (
            <div key={label}
              className="selling-point"
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: '#F7F7F7', borderRadius: 10, padding: '14px 22px',
                border: '1px solid #EEEEEE',
                transition: 'box-shadow 0.18s, transform 0.18s',
                cursor: 'default',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)'
                ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = 'none'
                ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
              }}
            >
              {icon}
              <span style={{ ...F, fontWeight: 700, fontSize: '0.95rem', color: '#1A1A1A' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Locations */}
      <div style={{ background: '#F7F7F7', padding: '56px 24px 72px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ background: '#F3BD25', display: 'inline-block', padding: '10px 20px', borderRadius: 4, marginBottom: 32 }}>
            <h2 style={{ ...R, fontSize: '1.6rem', color: '#1A1A1A', letterSpacing: '0.04em', margin: 0 }}>Our Locations</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {locations.map((loc, i) => (
              <div key={i} className="location-card" style={{ background: '#FFF', borderRadius: 12, border: '1px solid #EEEEEE', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: '45%', flexShrink: 0, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {loc.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={loc.image} alt={loc.name} style={{ width: '100%', height: 'auto', display: 'block' }} />
                  ) : (
                    <div style={{
                      width: '100%', minHeight: 220,
                      background: 'linear-gradient(135deg, #F0F0F0 0%, #E5E5E5 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#BBB', fontSize: '0.75rem', ...F,
                    }}>
                      Store Photo
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <h3 style={{ ...R, fontSize: '1.4rem', color: '#1A1A1A', letterSpacing: '0.04em', lineHeight: 1.2 }}>{loc.name}</h3>
                  <p style={{ ...F, fontSize: '0.875rem', color: '#1A1A1A', whiteSpace: 'pre-line' }}>{loc.address}</p>
                  <p style={{ ...F, fontSize: '0.875rem', color: '#F3BD25', fontWeight: 700 }}>{loc.phone}</p>
                  <p style={{ ...F, fontSize: '0.78rem', color: '#666' }}>{loc.hours}</p>
                  {loc.hasOrder && (
                    <a href="/" style={{
                      marginTop: 6, display: 'inline-block', padding: '10px 22px',
                      background: '#F3BD25', color: '#1A1A1A', borderRadius: 4,
                      ...R, fontSize: '1rem', letterSpacing: '0.04em', textDecoration: 'none',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#D9A815')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#F3BD25')}
                    >
                      Order Pickup
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .story-grid {
          display: flex;
          gap: 48px;
          align-items: start;
        }
        .story-text { flex: 55; min-width: 0; padding-top: 0; }
        .story-images { flex: 40; min-width: 0; padding-top: 0; }

        @media (max-width: 768px) {
          .story-grid { flex-direction: column; gap: 28px; }
          .story-images { width: 100%; }
        }

        @media (max-width: 600px) {
          .location-card { flex-direction: column !important; }
          .location-card > div:first-child { width: 100% !important; }
        }
      `}</style>
    </div>
  )
}
