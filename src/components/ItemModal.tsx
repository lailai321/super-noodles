'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { MenuItem } from '@/types'
import { useCartStore } from '@/store/cart'
import { DRINK_FLAVOURS } from '@/lib/drinkFlavours'
import { ITEM_OPTIONS, OptionGroup } from '@/lib/itemOptions'

interface Props { item: MenuItem | null; onClose: () => void }

interface ExtraOption { label: string; checked: boolean; set: (v: boolean) => void }

export default function ItemModal({ item, onClose }: Props) {
  const [qty, setQty] = useState(1)
  const [extraMeat, setExtraMeat] = useState(false)
  const [extraVeg, setExtraVeg] = useState(false)
  const [notes, setNotes] = useState('')
  const [flavourQtys, setFlavourQtys] = useState<Record<string, number>>({})
  const [optionSelections, setOptionSelections] = useState<Record<string, string[]>>({})
  const addItem = useCartStore(s => s.addItem)

  const flavours = item ? DRINK_FLAVOURS[item.uuid] : undefined
  const isDrink = !!flavours
  const itemOptionGroups: OptionGroup[] = item ? (ITEM_OPTIONS[item.uuid] ?? []) : []
  const requiredGroups = itemOptionGroups.filter(g => g.required)
  const optionalItemGroups = itemOptionGroups.filter(g => !g.required)

  useEffect(() => {
    if (item) {
      setQty(1)
      setExtraMeat(false)
      setExtraVeg(false)
      setNotes('')
      setFlavourQtys({})
      setOptionSelections({})
    }
  }, [item])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  if (!item) return null

  const unitCents = Math.round(item.price * 100)
  const totalFlavourQty = Object.values(flavourQtys).reduce((s, q) => s + q, 0)

  const optionExtrasCents = itemOptionGroups.reduce((sum, g) => {
    const sel = optionSelections[g.id] ?? []
    return sum + sel.reduce((s, label) => {
      const choice = g.choices.find(c => c.label === label)
      return s + (choice?.priceCents ?? 0)
    }, 0)
  }, 0)

  const extrasCents = isDrink ? 0 : (extraMeat ? 300 : 0) + (extraVeg ? 300 : 0) + optionExtrasCents
  const effectiveQty = isDrink ? totalFlavourQty : qty
  const total = (unitCents + extrasCents) * effectiveQty
  const allRequiredFilled = requiredGroups.every(g => (optionSelections[g.id] ?? []).length > 0)
  const canAdd = isDrink ? totalFlavourQty > 0 : allRequiredFilled

  const oldExtras: ExtraOption[] = []
  if (!isDrink && item.hasAddons) {
    if (!item.noExtraMeat) oldExtras.push({ label: 'Extra Meat', checked: extraMeat, set: setExtraMeat })
    if (!item.noExtraVeg) oldExtras.push({ label: 'Extra Vegetable', checked: extraVeg, set: setExtraVeg })
  }

  function toggleOption(groupId: string, label: string, multiSelect: boolean) {
    setOptionSelections(prev => {
      const current = prev[groupId] ?? []
      if (multiSelect) {
        const next = current.includes(label) ? current.filter(l => l !== label) : [...current, label]
        return { ...prev, [groupId]: next }
      }
      return { ...prev, [groupId]: [label] }
    })
  }

  function setFlavourQty(flavour: string, delta: number) {
    setFlavourQtys(prev => {
      const cur = prev[flavour] || 0
      const next = Math.min(10, Math.max(0, cur + delta))
      return { ...prev, [flavour]: next }
    })
  }

  function handleAdd() {
    if (!item || !canAdd) return
    if (isDrink) {
      const filtered = Object.fromEntries(Object.entries(flavourQtys).filter(([, q]) => q > 0))
      addItem({ uuid: item.uuid, name: item.name, price: item.price, quantity: totalFlavourQty, extraMeat: false, extraVegetable: false, notes: '', flavourSelections: filtered })
    } else {
      addItem({
        uuid: item.uuid, name: item.name, price: item.price, quantity: qty,
        extraMeat, extraVegetable: extraVeg, notes,
        ...(Object.keys(optionSelections).length > 0 ? { optionSelections } : {}),
        ...(optionExtrasCents > 0 ? { optionExtrasCents } : {}),
      })
    }
    onClose()
  }

  const closeBtn: React.CSSProperties = {
    position: 'absolute', top: 12, right: 12, zIndex: 10,
    width: 34, height: 34, borderRadius: '50%',
    background: 'rgba(0,0,0,0.5)',
    color: '#FFFFFF', border: 'none', fontSize: '1rem',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
    flexShrink: 0,
  }

  function renderOptionGroup(group: OptionGroup) {
    const sel = optionSelections[group.id] ?? []
    const isRequired = group.required
    return (
      <div key={group.id} style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <p style={{ fontFamily: "'Rackety DEMO', sans-serif", fontSize: '1rem', color: isRequired ? '#1A1A1A' : '#999', letterSpacing: '0.06em' }}>
            {group.label}
          </p>
          {isRequired ? (
            <span style={{ background: '#F3BD25', color: '#1A1A1A', fontFamily: "'BudgePair', sans-serif", fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 4 }}>
              Required
            </span>
          ) : (
            <span style={{ fontFamily: "'BudgePair', sans-serif", fontSize: '0.72rem', color: '#999', padding: '3px 0' }}>
              Optional
            </span>
          )}
        </div>
        {group.choices.map(choice => {
          const isSelected = sel.includes(choice.label)
          return (
            <div key={choice.label} onClick={() => toggleOption(group.id, choice.label, group.multiSelect)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px', borderRadius: 6, marginBottom: 8,
              background: isSelected ? 'rgba(243,189,37,0.08)' : '#F9F9F9',
              border: `1px solid ${isSelected ? '#F3BD25' : '#EEEEEE'}`,
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {group.multiSelect ? (
                  <div style={{
                    width: 18, height: 18, borderRadius: 3,
                    border: `2px solid ${isSelected ? '#F3BD25' : '#CCCCCC'}`,
                    background: isSelected ? '#F3BD25' : 'transparent',
                    flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {isSelected && <span style={{ color: '#1A1A1A', fontSize: '0.6rem', fontWeight: 900 }}>✓</span>}
                  </div>
                ) : (
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%',
                    border: `2px solid ${isSelected ? '#F3BD25' : '#CCCCCC'}`,
                    background: isSelected ? '#F3BD25' : 'transparent',
                    flexShrink: 0,
                  }} />
                )}
                <span style={{ fontFamily: "'BudgePair', sans-serif", fontSize: '0.9rem', color: '#1A1A1A' }}>{choice.label}</span>
              </div>
              <span style={{ fontFamily: "'BudgePair', sans-serif", fontSize: '0.85rem', fontWeight: 700, color: '#1A1A1A' }}>
                {choice.priceCents > 0 ? `+$${(choice.priceCents / 100).toFixed(2)}` : ''}
              </span>
            </div>
          )
        })}
        {isRequired && sel.length === 0 && (
          <p style={{ fontFamily: "'BudgePair', sans-serif", fontSize: '0.78rem', color: '#ef4444', marginTop: 4 }}>
            Please choose one
          </p>
        )}
      </div>
    )
  }

  let btnLabel: string
  if (isDrink && totalFlavourQty === 0) {
    btnLabel = 'Choose a flavour'
  } else if (!isDrink && !allRequiredFilled) {
    btnLabel = 'Choose required options'
  } else {
    btnLabel = `Add to Order — $${(total / 100).toFixed(2)}`
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)' }} />

      <div
        style={{
          position: 'relative', width: '100%', maxWidth: 560, margin: '24px 16px',
          background: '#FFFFFF', borderRadius: 12,
          maxHeight: '85vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          animation: 'slideUp 0.22s ease',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} style={closeBtn}>✕</button>

        {item.imageUrl && (
          <div style={{ position: 'relative', height: 180, flexShrink: 0, background: '#F5F5F5' }}>
            <Image src={item.imageUrl} alt={item.name} fill style={{ objectFit: 'cover' }} unoptimized />
          </div>
        )}

        <div style={{ padding: '16px 20px 12px', flexShrink: 0, borderBottom: '1px solid #EEEEEE' }}>
          <h2 style={{ fontFamily: "'BudgePair', sans-serif", fontWeight: 700, fontSize: '1.2rem', color: '#1A1A1A', marginBottom: 4, paddingRight: 32 }}>
            {item.name}
          </h2>
          <p style={{ fontFamily: "'BudgePair', sans-serif", fontWeight: 700, fontSize: '1.05rem', color: '#1A1A1A' }}>
            ${item.price.toFixed(2)}
          </p>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 20px' }}>
          {item.description && (
            <p style={{ fontFamily: "'BudgePair', sans-serif", fontSize: '0.875rem', color: '#666', lineHeight: 1.6, marginBottom: 16 }}>
              {item.description}
            </p>
          )}

          {/* Drink flavour picker (required) */}
          {isDrink && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <p style={{ fontFamily: "'Rackety DEMO', sans-serif", fontSize: '1rem', color: '#1A1A1A', letterSpacing: '0.06em' }}>
                  CHOOSE FLAVOURS
                </p>
                <span style={{ background: '#F3BD25', color: '#1A1A1A', fontFamily: "'BudgePair', sans-serif", fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 4 }}>
                  Required
                </span>
              </div>
              {flavours!.map(flavour => {
                const q = flavourQtys[flavour] || 0
                return (
                  <div key={flavour} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: 6, marginBottom: 8,
                    background: q > 0 ? 'rgba(243,189,37,0.08)' : '#F9F9F9',
                    border: `1px solid ${q > 0 ? '#F3BD25' : '#EEEEEE'}`,
                    transition: 'all 0.15s',
                  }}>
                    <span style={{ fontFamily: "'BudgePair', sans-serif", fontSize: '0.9rem', color: '#1A1A1A' }}>{flavour}</span>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #EEEEEE', borderRadius: 4, overflow: 'hidden' }}>
                      <button onClick={() => setFlavourQty(flavour, -1)}
                        style={{ width: 34, height: 34, background: '#F9F9F9', border: 'none', color: '#F3BD25', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                      <span style={{ width: 30, textAlign: 'center', fontFamily: "'BudgePair', sans-serif", fontWeight: 700, fontSize: '0.9rem', color: '#1A1A1A' }}>{q}</span>
                      <button onClick={() => setFlavourQty(flavour, 1)}
                        style={{ width: 34, height: 34, background: '#F9F9F9', border: 'none', color: '#F3BD25', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                    </div>
                  </div>
                )
              })}
              {totalFlavourQty === 0 && (
                <p style={{ fontFamily: "'BudgePair', sans-serif", fontSize: '0.78rem', color: '#ef4444', marginTop: 4 }}>
                  Please choose at least 1
                </p>
              )}
            </div>
          )}

          {/* Required option groups — always shown before optional (Change 7) */}
          {!isDrink && requiredGroups.map(g => renderOptionGroup(g))}

          {/* Optional item option groups */}
          {!isDrink && optionalItemGroups.map(g => renderOptionGroup(g))}

          {/* Old extras: Extra Meat / Extra Vegetable (optional, shown after required) */}
          {oldExtras.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontFamily: "'Rackety DEMO', sans-serif", fontSize: '1rem', color: '#999', letterSpacing: '0.06em', marginBottom: 10 }}>
                EXTRAS
              </p>
              {oldExtras.map(({ label, checked, set }) => (
                <label key={label} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 14px', borderRadius: 6, marginBottom: 8,
                  background: checked ? 'rgba(243,189,37,0.08)' : '#F9F9F9',
                  border: `1px solid ${checked ? '#F3BD25' : '#EEEEEE'}`,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="checkbox" checked={checked} onChange={e => set(e.target.checked)}
                      style={{ width: 18, height: 18, accentColor: '#F3BD25', cursor: 'pointer' }} />
                    <span style={{ fontFamily: "'BudgePair', sans-serif", fontSize: '0.9rem', color: '#1A1A1A' }}>{label}</span>
                  </div>
                  <span style={{ fontFamily: "'BudgePair', sans-serif", fontSize: '0.85rem', fontWeight: 700, color: '#1A1A1A' }}>+$3.00</span>
                </label>
              ))}
            </div>
          )}

          {!isDrink && (
            <div>
              <p style={{ fontFamily: "'Rackety DEMO', sans-serif", fontSize: '1rem', color: '#999', letterSpacing: '0.06em', marginBottom: 8 }}>
                SPECIAL INSTRUCTIONS (OPTIONAL)
              </p>
              <textarea
                value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="e.g. No spring onions, less chilli…"
                rows={2}
                style={{
                  width: '100%', background: '#FFF', border: '1px solid #DDDDDD',
                  borderRadius: 4, padding: '10px 14px', color: '#1A1A1A',
                  fontFamily: "'BudgePair', sans-serif", fontSize: '0.875rem',
                  resize: 'none', outline: 'none', transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.target.style.borderColor = '#F3BD25')}
                onBlur={e => (e.target.style.borderColor = '#DDDDDD')}
              />
            </div>
          )}
        </div>

        <div style={{ padding: '12px 20px 20px', background: '#FFF', display: 'flex', gap: 12, alignItems: 'center', borderTop: '1px solid #EEEEEE', flexShrink: 0 }}>
          {!isDrink && (
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #EEEEEE', borderRadius: 4, overflow: 'hidden', flexShrink: 0 }}>
              <button onClick={() => setQty(Math.max(1, qty - 1))} style={{
                width: 38, height: 46, color: '#F3BD25', fontSize: '1.4rem',
                background: '#F9F9F9', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>−</button>
              <span style={{ width: 34, textAlign: 'center', fontFamily: "'BudgePair', sans-serif", fontWeight: 700, fontSize: '1rem', color: '#1A1A1A' }}>{qty}</span>
              <button onClick={() => setQty(qty + 1)} style={{
                width: 38, height: 46, color: '#F3BD25', fontSize: '1.4rem',
                background: '#F9F9F9', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>+</button>
            </div>
          )}
          <button
            onClick={handleAdd}
            disabled={!canAdd}
            className="btn-brand"
            style={{ flex: 1, opacity: canAdd ? 1 : 0.45, cursor: canAdd ? 'pointer' : 'not-allowed' }}
          >
            {btnLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
