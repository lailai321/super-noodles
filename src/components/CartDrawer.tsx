'use client'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cart'

interface Props { open: boolean; onClose: () => void }

export default function CartDrawer({ open, onClose }: Props) {
  const router = useRouter()
  const { items, updateQuantity, removeItem, totalCents } = useCartStore()

  if (!open) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200 }} onClick={onClose}>
      {/* Backdrop */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)' }} />

      {/* Drawer */}
      <div className="cart-drawer" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px 14px', borderBottom: '1px solid #EEEEEE', flexShrink: 0 }}>
          <h2 style={{ fontFamily: "'Rackety DEMO', sans-serif", fontSize: '1.5rem', color: '#1A1A1A', letterSpacing: '0.06em' }}>
            Your Order
          </h2>
          <button onClick={onClose} style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'rgba(0,0,0,0.5)', border: 'none',
            color: '#FFFFFF', fontSize: '1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.25)', flexShrink: 0,
          }}>
            ✕
          </button>
        </div>

        {/* Items */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '4px 22px' }}>
          {items.length === 0 && (
            <p style={{ textAlign: 'center', color: '#999', padding: '48px 0', fontFamily: "'BudgePair', sans-serif", fontSize: '0.9rem' }}>
              Your cart is empty
            </p>
          )}
          {items.map((item, i) => {
            const extras = (item.extraMeat ? 300 : 0) + (item.extraVegetable ? 300 : 0) + (item.optionExtrasCents ?? 0)
            const lineTotal = (Math.round(item.price * 100) + extras) * item.quantity
            const hasFlavours = item.flavourSelections && Object.keys(item.flavourSelections).length > 0
            const flavourSummary = hasFlavours
              ? Object.entries(item.flavourSelections!).filter(([, q]) => q > 0).map(([f, q]) => `${f} x${q}`).join(', ')
              : null
            const optionsSummary = item.optionSelections
              ? Object.values(item.optionSelections).flat().filter(Boolean).join(', ')
              : null
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 0', borderBottom: '1px solid #EEEEEE' }}>
                {hasFlavours ? (
                  <div style={{ width: 60, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: "'BudgePair', sans-serif", fontWeight: 700, fontSize: '0.85rem', color: '#1A1A1A' }}>×{item.quantity}</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, border: '1px solid #EEEEEE', borderRadius: 4, overflow: 'hidden', flexShrink: 0 }}>
                    <button onClick={() => updateQuantity(item.uuid, item.extraMeat, item.extraVegetable, item.notes, item.quantity - 1, item.flavourSelections, item.optionSelections)}
                      style={{ width: 28, height: 28, background: '#F9F9F9', border: 'none', color: '#F3BD25', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      −
                    </button>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1A1A1A', width: 20, textAlign: 'center', fontFamily: "'BudgePair', sans-serif" }}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.uuid, item.extraMeat, item.extraVegetable, item.notes, item.quantity + 1, item.flavourSelections, item.optionSelections)}
                      style={{ width: 28, height: 28, background: '#F9F9F9', border: 'none', color: '#F3BD25', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      +
                    </button>
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: "'BudgePair', sans-serif", fontWeight: 700, fontSize: '0.9rem', color: '#1A1A1A' }}>{item.name}</p>
                  {optionsSummary && <p style={{ fontFamily: "'BudgePair', sans-serif", fontSize: '0.75rem', color: '#666' }}>{optionsSummary}</p>}
                  {flavourSummary && <p style={{ fontFamily: "'BudgePair', sans-serif", fontSize: '0.75rem', color: '#666' }}>{flavourSummary}</p>}
                  {item.extraMeat && <p style={{ fontFamily: "'BudgePair', sans-serif", fontSize: '0.75rem', color: '#666' }}>+ Extra Meat</p>}
                  {item.extraVegetable && <p style={{ fontFamily: "'BudgePair', sans-serif", fontSize: '0.75rem', color: '#666' }}>+ Extra Vegetable</p>}
                  {item.notes && <p style={{ fontFamily: "'BudgePair', sans-serif", fontSize: '0.75rem', color: '#999', fontStyle: 'italic' }}>{item.notes}</p>}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontFamily: "'BudgePair', sans-serif", fontWeight: 700, fontSize: '0.9rem', color: '#1A1A1A' }}>${(lineTotal / 100).toFixed(2)}</p>
                  <button onClick={() => removeItem(item.uuid, item.extraMeat, item.extraVegetable, item.notes, item.flavourSelections, item.optionSelections)}
                    style={{ fontFamily: "'BudgePair', sans-serif", fontSize: '0.72rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', marginTop: 4 }}>
                    Remove
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{ padding: '14px 22px 28px', borderTop: '1px solid #EEEEEE', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontFamily: "'BudgePair', sans-serif", color: '#666', fontSize: '0.9rem' }}>Total</span>
              <span style={{ fontFamily: "'Rackety DEMO', sans-serif", fontSize: '1.3rem', color: '#1A1A1A', letterSpacing: '0.04em' }}>
                ${(totalCents() / 100).toFixed(2)}
              </span>
            </div>
            <button className="btn-brand" onClick={() => { onClose(); router.push('/checkout') }}>
              Go to Checkout
            </button>
          </div>
        )}
      </div>

      <style>{`
        .cart-drawer {
          position: fixed;
          right: 0;
          top: 0;
          bottom: 0;
          width: 420px;
          max-width: 100%;
          background: #FFFFFF;
          display: flex;
          flex-direction: column;
          box-shadow: -8px 0 40px rgba(0,0,0,0.15);
        }
        @media (max-width: 768px) {
          .cart-drawer {
            top: auto;
            left: 0;
            width: 100%;
            max-height: 85svh;
            border-radius: 12px 12px 0 0;
            box-shadow: 0 -8px 40px rgba(0,0,0,0.12);
          }
        }
      `}</style>
    </div>
  )
}
