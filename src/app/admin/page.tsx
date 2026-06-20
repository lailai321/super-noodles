'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Bell, Check, ExternalLink, LogOut, RefreshCw, UtensilsCrossed } from 'lucide-react'
import type { MenuCategory, MenuItem } from '@/types'
import { getOrderGifts } from '@/lib/giftRules'

type Tab = 'orders' | 'menu' | 'holidays'
type OrderStatus = 'confirmed' | 'ready' | 'collected'
type SmsStatus = 'not_sent' | 'sending' | 'sent' | 'failed'

interface AdminOrderItem {
  id: string
  item_name: string
  quantity: number
  unit_price_cents: number
  extra_meat: boolean
  extra_vegetable: boolean
  notes: string
}

interface AdminOrder {
  id: string
  order_number: number
  customer_name: string
  customer_phone: string
  total_cents: number
  pickup_time: string
  status: OrderStatus
  created_at: string
  acknowledged_at: string | null
  ready_at: string | null
  collected_at: string | null
  sms_status: SmsStatus
  sms_sent_at: string | null
  sms_error: string | null
  order_items: AdminOrderItem[]
}

interface MenuData {
  categories: MenuCategory[]
  soldOut: string[]
  overrides: Record<string, { price_cents?: number; is_hidden?: boolean }>
}

const actionClass = 'min-h-12 rounded-lg px-5 text-sm font-bold tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-50'

function formatOrderTime(value: string) {
  return new Date(value).toLocaleTimeString('en-AU', {
    timeZone: 'Australia/Sydney',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function pickupLabel(value: string) {
  return value === 'asap' ? 'ASAP (~15 min)' : value
}

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit, timeoutMs = 8000) {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } finally {
    window.clearTimeout(timeout)
  }
}

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [authError, setAuthError] = useState('')
  const [tab, setTab] = useState<Tab>('orders')
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [menuData, setMenuData] = useState<MenuData | null>(null)
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [migrationNeeded, setMigrationNeeded] = useState(false)
  const [smsConfigured, setSmsConfigured] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [audioUnlocked, setAudioUnlocked] = useState(false)
  const [pastDate, setPastDate] = useState('')
  const [pastOrders, setPastOrders] = useState<AdminOrder[] | null>(null)
  const [loadingPast, setLoadingPast] = useState(false)
  const [holidays, setHolidays] = useState<string[]>([])
  const [loadingHolidays, setLoadingHolidays] = useState(false)
  const [holidayMsg, setHolidayMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const audioRef = useRef<AudioContext | null>(null)
  const previousTitle = useRef('Super Noodles Admin')

  const activeOrders = useMemo(() => orders, [orders])
  const confirmedCount = useMemo(
    () => activeOrders.filter(o => o.status === 'confirmed').length,
    [activeOrders]
  )
  const unacknowledged = useMemo(
    () => activeOrders.filter(order => !order.acknowledged_at),
    [activeOrders]
  )

  const unlockSound = useCallback(() => {
    if (!audioRef.current) audioRef.current = new AudioContext()
    void audioRef.current.resume()
    setAudioUnlocked(true)
  }, [])

  const playAlert = useCallback(() => {
    const context = audioRef.current
    if (!context || context.state !== 'running') return
    const now = context.currentTime
    ;[659.25, 783.99, 987.77].forEach((frequency, index) => {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.value = frequency
      gain.gain.setValueAtTime(0.0001, now + index * 0.2)
      gain.gain.exponentialRampToValueAtTime(0.18, now + index * 0.2 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.2 + 0.16)
      oscillator.connect(gain).connect(context.destination)
      oscillator.start(now + index * 0.2)
      oscillator.stop(now + index * 0.2 + 0.18)
    })
  }, [])

  const loadOrders = useCallback(async (quiet = false) => {
    if (!quiet) setLoadingOrders(true)
    try {
      const res = await fetch('/api/admin/orders', { cache: 'no-store' })
      if (res.status === 401) { setAuthed(false); return }
      const data = await res.json()
      if (!res.ok) {
        setMigrationNeeded(Boolean(data.migrationNeeded))
        throw new Error(data.error || 'Could not load orders')
      }
      setOrders(data.orders)
      setSmsConfigured(Boolean(data.smsConfigured))
      setMigrationNeeded(false)
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load orders')
    } finally {
      if (!quiet) setLoadingOrders(false)
    }
  }, [])

  const loadMenu = useCallback(async () => {
    const res = await fetch('/api/menu', { cache: 'no-store' })
    setMenuData(await res.json())
  }, [])

  const loadPastOrders = useCallback(async (date: string) => {
    setLoadingPast(true)
    setPastOrders(null)
    try {
      const res = await fetch(`/api/admin/orders?date=${date}`, { cache: 'no-store' })
      if (res.status === 401) { setAuthed(false); return }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not load past orders')
      setPastOrders(data.orders)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load past orders')
      setPastOrders([])
    } finally {
      setLoadingPast(false)
    }
  }, [])

  const loadHolidays = useCallback(async () => {
    setLoadingHolidays(true)
    try {
      const res = await fetch('/api/admin/holidays', { cache: 'no-store' })
      if (res.status === 401) { setAuthed(false); return }
      const data = await res.json()
      if (res.ok) setHolidays(data.holidays ?? [])
    } finally {
      setLoadingHolidays(false)
    }
  }, [])

  useEffect(() => {
    fetchWithTimeout('/api/admin/auth', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => setAuthed(Boolean(data.authenticated)))
      .catch(() => setAuthed(false))
  }, [])

  useEffect(() => {
    if (!authed) return
    const initialLoad = window.setTimeout(() => void loadOrders(), 0)
    const poll = window.setInterval(() => {
      if (document.visibilityState === 'visible') void loadOrders(true)
    }, 5000)
    const onVisible = () => {
      if (document.visibilityState === 'visible') void loadOrders(true)
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearTimeout(initialLoad)
      window.clearInterval(poll)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [authed, loadOrders])

  useEffect(() => {
    if (!authed || tab !== 'menu' || menuData) return
    const initialLoad = window.setTimeout(() => void loadMenu(), 0)
    return () => window.clearTimeout(initialLoad)
  }, [authed, loadMenu, menuData, tab])

  useEffect(() => {
    if (!authed || tab !== 'holidays') return
    void loadHolidays()
  }, [authed, loadHolidays, tab])

  useEffect(() => {
    if (!unacknowledged.length) return
    playAlert()
    const alertTimer = window.setInterval(playAlert, 20000)
    return () => window.clearInterval(alertTimer)
  }, [playAlert, unacknowledged.length])

  useEffect(() => {
    const normalTitle = previousTitle.current
    if (!unacknowledged.length) {
      document.title = normalTitle
      return
    }
    let showAlert = true
    const titleTimer = window.setInterval(() => {
      document.title = showAlert
        ? `NEW ORDER #${String(unacknowledged[0].order_number).padStart(4, '0')}`
        : normalTitle
      showAlert = !showAlert
    }, 1000)
    return () => {
      window.clearInterval(titleTimer)
      document.title = normalTitle
    }
  }, [unacknowledged])

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault()
    setAuthError('')
    try {
      const res = await fetchWithTimeout('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        setAuthed(true)
      } else {
        const data = await res.json().catch(() => ({}))
        setAuthError(
          res.status === 429
            ? 'Too many attempts. Please wait 15 minutes.'
            : data.error === 'Unauthorized'
              ? 'Incorrect password'
              : data.error || 'Login failed'
        )
      }
    } catch {
      setAuthError('Could not connect. Please check Wi-Fi and try again.')
    }
  }

  async function logout() {
    await fetch('/api/admin/auth', { method: 'DELETE' })
    setAuthed(false)
    setOrders([])
    setMenuData(null)
  }

  async function runOrderAction(order: AdminOrder, action: 'acknowledge' | 'ready' | 'collected' | 'retry_sms') {
    if (action === 'ready' && !window.confirm(
      `Mark order #${String(order.order_number).padStart(4, '0')} as ready and notify the customer?`
    )) return

    setSaving(`${order.id}:${action}`)
    setError('')
    const res = await fetch('/api/admin/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: order.id, action }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Action failed')
    } else if (action === 'ready' && data.sms?.error) {
      setError(`Order marked ready, but SMS failed: ${data.sms.error}`)
    } else {
      const labels = {
        acknowledge: 'New order acknowledged',
        ready: 'Order marked ready',
        collected: 'Order marked collected',
        retry_sms: data.sms?.sent ? 'SMS sent' : 'SMS was not sent',
      }
      setMessage(labels[action])
      window.setTimeout(() => setMessage(''), 3000)
    }
    await loadOrders(true)
    setSaving(null)
  }

  async function toggleSoldOut(item: MenuItem, currentlySoldOut: boolean) {
    setMenuData(prev => {
      if (!prev) return prev
      const soldOut = currentlySoldOut
        ? prev.soldOut.filter(id => id !== item.uuid)
        : [...prev.soldOut, item.uuid]
      return { ...prev, soldOut }
    })
    const res = await fetch('/api/admin/soldout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uuid: item.uuid, name: item.name, soldOut: !currentlySoldOut }),
    })
    if (res.status === 401) return setAuthed(false)
    if (!res.ok) {
      setMenuData(prev => {
        if (!prev) return prev
        const soldOut = currentlySoldOut
          ? [...prev.soldOut, item.uuid]
          : prev.soldOut.filter(id => id !== item.uuid)
        return { ...prev, soldOut }
      })
      setError('Could not update item. Please try again.')
    }
  }

  async function toggleHoliday(date: string) {
    const isHoliday = holidays.includes(date)
    setHolidays(prev => isHoliday ? prev.filter(d => d !== date) : [...prev, date].sort())
    setHolidayMsg(null)
    const res = await fetch('/api/admin/holidays', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, action: isHoliday ? 'remove' : 'add' }),
    })
    if (res.status === 401) return setAuthed(false)
    if (!res.ok) {
      setHolidays(prev => isHoliday ? [...prev, date].sort() : prev.filter(d => d !== date))
      const body = await res.json().catch(() => ({}))
      setHolidayMsg({ type: 'error', text: body.error || 'Could not update holiday. Please try again.' })
    } else {
      const body = await res.json().catch(() => ({}))
      const written = body._written ?? true
      const verifyErr = body._verifyErr ?? null
      if (!written || verifyErr) {
        setHolidayMsg({ type: 'error', text: verifyErr ? `DB error: ${verifyErr}` : 'Saved OK but data not found in DB — check SUPABASE_SERVICE_ROLE_KEY in Vercel env vars.' })
      } else {
        setHolidayMsg({ type: 'success', text: isHoliday ? 'Removed.' : 'Saved. Store will show as closed.' })
        setTimeout(() => setHolidayMsg(null), 4000)
      }
    }
  }

  if (authed === null) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <RefreshCw className="animate-spin text-gray-300" size={28} />
      </div>
    )
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center px-4">
        <form onSubmit={handleLogin} className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-sm border border-[#E5E5E5]">
          <h1 className="text-2xl font-black text-gray-900 mb-1">Staff Login</h1>
          <p className="text-sm text-gray-500 mb-6">Super Noodles – Glenmore Park</p>
          <label htmlFor="admin-password" className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            className="w-full border border-[#E5E5E5] rounded-xl px-4 py-3 text-base mb-3 focus:outline-none focus:ring-2 focus:ring-[#FFC200]"
            required
          />
          {authError && <p className="text-red-600 text-sm mb-3">{authError}</p>}
          <button type="submit" className="w-full min-h-12 bg-[#1A1A1A] text-white font-bold rounded-xl hover:bg-black transition-colors">
            Login
          </button>
        </form>
      </div>
    )
  }

  const newestAlert = unacknowledged[0]
  const todaySydney = new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' })

  return (
    <div className="min-h-screen bg-white">
      {newestAlert && (
        <div className="admin-alert sticky top-0 z-50 bg-[#1A1A1A] border-b-2 border-[#FFC200] text-white">
          <div className="admin-shell mx-auto px-6 py-3 flex items-center gap-3">
            <Bell size={18} className="text-[#FFC200] shrink-0" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="font-black tracking-wide text-sm">NEW ORDER #{String(newestAlert.order_number).padStart(4, '0')}</p>
              <p className="text-xs text-gray-400">{newestAlert.customer_name} · {pickupLabel(newestAlert.pickup_time)}</p>
            </div>
            <button
              onClick={() => runOrderAction(newestAlert, 'ready')}
              disabled={saving === `${newestAlert.id}:ready`}
              className="min-h-8 px-4 rounded-lg bg-[#FFC200] text-[#1A1A1A] text-xs font-black hover:bg-yellow-300 transition-colors shrink-0"
            >
              MARK READY
            </button>
          </div>
        </div>
      )}

      <header className="admin-header bg-[#1A1A1A] text-white">
        <div className="admin-shell mx-auto px-6 py-4 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-black leading-tight tracking-wide">Super Noodles Admin</h1>
            <p className="text-xs text-white opacity-70">Glenmore Park</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={unlockSound}
              disabled={audioUnlocked}
              className={`min-h-9 px-4 rounded-lg text-xs font-black transition-colors shrink-0 flex items-center gap-1.5 ${
                audioUnlocked
                  ? 'bg-green-500 text-white disabled:cursor-default'
                  : 'bg-[#FFC200] text-[#1A1A1A] hover:bg-yellow-300'
              }`}
            >
              {audioUnlocked ? <Check size={14} strokeWidth={3} /> : null}
              {audioUnlocked ? 'Accepting Orders' : 'Start Accepting Orders 开始接单'}
            </button>
            <Link
              href="/?admin=true"
              className="min-h-9 px-4 rounded-lg border border-gray-600 flex items-center gap-1.5 hover:bg-gray-800 text-xs font-bold shrink-0 transition-colors"
            >
              <ExternalLink size={13} /> View Store
            </Link>
            <button
              onClick={logout}
              className="min-h-9 px-4 rounded-lg border border-gray-600 flex items-center gap-1.5 hover:bg-gray-800 text-xs font-bold shrink-0 transition-colors"
            >
              <LogOut size={13} /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="admin-shell mx-auto px-6 pb-16" style={{ paddingTop: 24 }}>
        <div className="admin-tabs flex gap-3" role="tablist">
          {([
            ['orders', `Orders${confirmedCount ? ` (${confirmedCount})` : ''}`],
            ['menu', 'Menu'],
            ['holidays', 'Holidays'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className={`min-h-10 flex-1 rounded-lg font-bold text-sm transition-colors ${
                tab === value
                  ? 'bg-[#FFC200] text-[#1A1A1A]'
                  : 'bg-white border border-[#E5E5E5] text-gray-600 hover:border-gray-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="admin-main-content">
          {message && (
            <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3 mb-4 text-sm">
              {message}
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3 mb-4 text-sm">
              {error}
            </div>
          )}
          {migrationNeeded && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-4 py-3 mb-4 text-sm">
              The order database migration must be applied before Orders can be used.
            </div>
          )}
          {!smsConfigured && tab === 'orders' && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-4 py-3 mb-4 text-sm">
              <strong>SMS not configured.</strong> Ready orders will show SMS Failed until ClickSend credentials are added.
            </div>
          )}

          {tab === 'orders' ? (
            <>
              {/* ── Active Orders ── */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl font-black text-gray-900">Active Orders</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Refreshes every 5 seconds</p>
                </div>
                <button
                  onClick={() => loadOrders()}
                  className="min-h-10 w-10 rounded-xl bg-white border border-[#E5E5E5] flex items-center justify-center shrink-0 hover:border-gray-400 transition-colors"
                  aria-label="Refresh orders"
                >
                  <RefreshCw size={16} className={loadingOrders ? 'animate-spin' : ''} />
                </button>
              </div>

              {!activeOrders.length && !loadingOrders && !migrationNeeded && (
                <div className="bg-white border border-[#E5E5E5] rounded-2xl py-16 text-center">
                  <UtensilsCrossed className="mx-auto mb-3 text-gray-200" size={36} />
                  <p className="text-sm text-gray-500">No active orders today.</p>
                </div>
              )}

              <div className="admin-order-grid">
                {activeOrders.map(order => (
                  <OrderCard key={order.id} order={order} saving={saving} onAction={runOrderAction} />
                ))}
              </div>

              {/* ── Past Orders ── */}
              <div className="mt-12 pt-8 border-t-2 border-[#F0F0F0]">
                <h2 className="text-xl font-black text-gray-900 mb-1">Past Orders</h2>
                <p className="text-xs text-gray-500 mb-4">View orders by date</p>
                <input
                  type="date"
                  value={pastDate}
                  max={todaySydney}
                  onChange={e => {
                    setPastDate(e.target.value)
                    if (e.target.value) void loadPastOrders(e.target.value)
                    else setPastOrders(null)
                  }}
                  className="border border-[#E5E5E5] rounded-xl px-4 py-2.5 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#FFC200] bg-white mb-5"
                />
                {!pastDate && (
                  <div className="border border-dashed border-gray-200 rounded-2xl py-14 text-center text-gray-400 text-sm">
                    Select a date to view past orders
                  </div>
                )}
                {pastDate && loadingPast && (
                  <div className="flex justify-center py-12">
                    <RefreshCw className="animate-spin text-gray-300" size={24} />
                  </div>
                )}
                {pastDate && !loadingPast && pastOrders !== null && (
                  pastOrders.length === 0 ? (
                    <div className="border border-dashed border-gray-200 rounded-2xl py-14 text-center text-gray-400 text-sm">
                      No orders found for {pastDate}
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-gray-500 mb-4">
                        {pastOrders.length} order{pastOrders.length !== 1 ? 's' : ''} on {pastDate}
                      </p>
                      <div className="admin-order-grid opacity-80">
                        {pastOrders.map(order => (
                          <OrderCard key={order.id} order={order} saving={null} onAction={() => {}} readOnly />
                        ))}
                      </div>
                    </>
                  )
                )}
              </div>
            </>
          ) : tab === 'menu' ? (
            <MenuAdmin data={menuData} saving={saving} onToggleSoldOut={toggleSoldOut} />
          ) : (
            <HolidayAdmin holidays={holidays} loading={loadingHolidays} onToggle={toggleHoliday} msg={holidayMsg} />
          )}
        </div>
      </main>

      <style>{`
        .admin-shell { width: 100%; max-width: 1080px; }
        .admin-main-content { padding-top: 24px; }
        .admin-tabs { padding-left: 24px; padding-right: 24px; }
        .admin-order-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 12px;
        }
        @media (min-width: 768px) {
          .admin-header {
            position: sticky;
            top: 0;
            z-index: 40;
            border-bottom: 1px solid #2A2A2A;
          }
          .admin-tabs {
            position: sticky;
            top: 65px;
            z-index: 30;
            padding: 12px 24px;
            margin: 0 -24px 4px;
            background: white;
            border-bottom: 1px solid #F0F0F0;
          }
          .admin-main-content { padding-top: 20px; }
          .admin-order-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            align-items: start;
          }
          .admin-order-actions {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
            align-items: end;
          }
          .admin-order-actions > :only-child,
          .admin-order-actions > .admin-sms-error {
            grid-column: 1 / -1;
          }
          .admin-menu-list {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
          }
        }
        @media (min-width: 1200px) {
          .admin-order-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
          .admin-order-card-body {
            grid-template-columns: minmax(0, 1fr) 220px;
          }
          .admin-order-actions { display: flex; flex-direction: column; }
        }
      `}</style>
    </div>
  )
}

function OrderCard({
  order,
  saving,
  onAction,
  readOnly = false,
}: {
  order: AdminOrder
  saving: string | null
  onAction: (order: AdminOrder, action: 'acknowledge' | 'ready' | 'collected' | 'retry_sms') => void
  readOnly?: boolean
}) {
  const gifts = getOrderGifts(order.total_cents)
  const isNew = !readOnly && !order.acknowledged_at
  const statusCls = order.status === 'ready'
    ? 'bg-green-600 text-white'
    : 'bg-[#FFC200] text-[#1A1A1A]'
  const statusLabel = order.status === 'ready' ? 'Ready for Pickup' : 'Preparing'
  return (
    <article className={`bg-white border rounded-xl overflow-hidden ${isNew ? 'border-[#FFC200] ring-2 ring-yellow-50' : 'border-[#E5E5E5]'}`}>
      {/* Row 1: order # + status + amount */}
      <div className="px-4 pt-4 pb-3 border-b border-[#F0F0F0] flex items-center gap-2">
        <h3 className="text-lg font-black text-gray-900 shrink-0">#{String(order.order_number).padStart(4, '0')}</h3>
        <span className={`text-xs font-black rounded-full px-2.5 py-0.5 shrink-0 ${statusCls}`}>
          {statusLabel}
        </span>
        {isNew && <span className="text-xs font-black text-[#FFC200] tracking-wide shrink-0">● New</span>}
        <span className="flex-1" />
        <p className="text-lg font-black text-gray-900 shrink-0">${(order.total_cents / 100).toFixed(2)}</p>
      </div>

      {/* Row 2: time + pickup */}
      <div className="px-4 py-2 bg-[#FAFAFA] border-b border-[#F0F0F0]">
        <p className="text-xs text-gray-500">
          <span className="font-semibold text-gray-700">{formatOrderTime(order.created_at)}</span>
          {' · Pickup: '}
          <span className="font-semibold text-gray-700">{pickupLabel(order.pickup_time)}</span>
        </p>
      </div>

      <div className="admin-order-card-body px-4 py-4 grid gap-4">
        <div>
          {/* Row 3 & 4: customer name + masked phone */}
          <div className="mb-3 pb-3 border-b border-[#F0F0F0]">
            <p className="font-black text-gray-900">{order.customer_name}</p>
            <p className="text-xs text-gray-400 mt-0.5">{order.customer_phone}</p>
          </div>

          {/* Items */}
          <div className="space-y-2.5">
            {order.order_items.map(item => (
              <div key={item.id} className="pl-3 border-l-2 border-[#E5E5E5]">
                <p className="font-bold text-gray-900 text-sm">{item.quantity} × {item.item_name}</p>
                {item.extra_meat && <p className="text-xs text-gray-500 mt-0.5">+ Extra Meat</p>}
                {item.extra_vegetable && <p className="text-xs text-gray-500">+ Extra Vegetable</p>}
                {item.notes && <p className="text-xs text-gray-400 mt-0.5 italic">{item.notes}</p>}
              </div>
            ))}
          </div>

          {/* FREE GIFT */}
          {gifts.length > 0 && (
            <div className="mt-3 rounded-lg border-2 border-[#FFC200] bg-amber-50 px-3 py-2">
              <p className="text-xs font-black text-amber-800 uppercase tracking-wide mb-1">🎁 Free Gift</p>
              {gifts.map(gift => (
                <p key={gift} className="font-bold text-gray-900 text-sm">{gift}</p>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="admin-order-actions flex flex-col gap-2 justify-end">
          {order.sms_status === 'sent' && (
            <p className="text-xs font-bold text-green-700 flex items-center gap-1.5">
              <Check size={13} /> SMS sent
            </p>
          )}
          {order.sms_status === 'sending' && (
            <p className="text-xs font-bold text-amber-600">Sending SMS...</p>
          )}
          {!readOnly && order.sms_status === 'failed' && (
            <div className="admin-sms-error bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs font-black text-red-700">SMS FAILED</p>
              <p className="text-xs text-red-600 mt-1 break-words">{order.sms_error}</p>
              <button
                onClick={() => onAction(order, 'retry_sms')}
                disabled={saving === `${order.id}:retry_sms`}
                className={`${actionClass} w-full mt-2 bg-red-600 text-white hover:bg-red-700`}
              >
                RETRY SMS
              </button>
            </div>
          )}
          {!readOnly && order.status === 'confirmed' && (
            <button
              onClick={() => onAction(order, 'ready')}
              disabled={saving === `${order.id}:ready`}
              className={`${actionClass} bg-green-600 text-white hover:bg-green-700`}
            >
              MARK READY
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

function HolidayAdmin({
  holidays,
  loading,
  onToggle,
  msg,
}: {
  holidays: string[]
  loading: boolean
  onToggle: (date: string) => void
  msg: { type: 'success' | 'error'; text: string } | null
}) {
  const todaySydney = new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' })
  const [year, setYear] = useState(() => parseInt(todaySydney.slice(0, 4)))
  const [month, setMonth] = useState(() => parseInt(todaySydney.slice(5, 7)) - 1)

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startDow = (firstDay.getDay() + 6) % 7 // Mon=0, Sun=6
  const monthLabel = firstDay.toLocaleString('en-AU', { month: 'long', year: 'numeric' })

  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  function dateStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-black text-gray-900">Holiday Management</h2>
        {loading && <RefreshCw size={16} className="animate-spin text-gray-400" />}
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Click a date to mark or unmark as a rest day. Customers will see a closed message on marked dates.
      </p>

      {msg && (
        <div style={{
          marginBottom: 16,
          padding: '10px 14px',
          borderRadius: 8,
          background: msg.type === 'success' ? '#F0FDF4' : '#FEF2F2',
          border: `1.5px solid ${msg.type === 'success' ? '#BBF7D0' : '#FECACA'}`,
          color: msg.type === 'success' ? '#166534' : '#DC2626',
          fontSize: '0.875rem',
          fontWeight: 700,
        }}>
          {msg.type === 'error' && '⚠ '}{msg.text}
        </div>
      )}

      <div className="bg-white border border-[#E5E5E5] rounded-2xl overflow-hidden" style={{ maxWidth: 384 }}>
        {/* Month navigation */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0F0F0]">
          <button
            onClick={prevMonth}
            className="w-9 h-9 rounded-lg border border-[#E5E5E5] flex items-center justify-center hover:border-gray-400 transition-colors text-gray-600 font-bold text-xl leading-none"
          >
            ‹
          </button>
          <span className="font-black text-gray-900 text-sm">{monthLabel}</span>
          <button
            onClick={nextMonth}
            className="w-9 h-9 rounded-lg border border-[#E5E5E5] flex items-center justify-center hover:border-gray-400 transition-colors text-gray-600 font-bold text-xl leading-none"
          >
            ›
          </button>
        </div>

        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '12px 14px 4px' }}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <div key={i} style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#9CA3AF', paddingBottom: 4 }}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, padding: '0 14px 14px' }}>
          {cells.map((day, i) => {
            if (!day) return <div key={i} />
            const ds = dateStr(day)
            const isHoliday = holidays.includes(ds)
            const isToday = ds === todaySydney
            return (
              <button
                key={ds}
                onClick={() => onToggle(ds)}
                className={`flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                  isHoliday
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'text-gray-800 hover:bg-amber-50'
                }`}
                style={{
                  aspectRatio: '1',
                  width: '100%',
                  outline: isToday && !isHoliday ? '2px solid #FFC200' : 'none',
                  outlineOffset: '-2px',
                }}
              >
                {day}
              </button>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-5 mt-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span style={{ width: 14, height: 14, borderRadius: 4, background: '#EF4444', display: 'inline-block', flexShrink: 0 }} />
          Rest day (store closed)
        </span>
        <span className="flex items-center gap-1.5">
          <span style={{ width: 14, height: 14, borderRadius: 4, outline: '2px solid #FFC200', display: 'inline-block', flexShrink: 0 }} />
          Today
        </span>
      </div>

      {holidays.length > 0 && (
        <div className="mt-6 max-w-sm">
          <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Upcoming Rest Days</p>
          <div className="space-y-1">
            {holidays
              .filter(d => d >= todaySydney)
              .slice(0, 6)
              .map(d => (
                <div key={d} className="flex items-center justify-between bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  <span className="text-sm font-bold text-red-800">
                    {new Date(d + 'T12:00:00').toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  <button
                    onClick={() => onToggle(d)}
                    className="text-xs text-red-500 hover:text-red-700 font-bold ml-3 shrink-0"
                  >
                    Remove
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MenuAdmin({
  data,
  saving,
  onToggleSoldOut,
}: {
  data: MenuData | null
  saving: string | null
  onToggleSoldOut: (item: MenuItem, currentlySoldOut: boolean) => void
}) {
  if (!data) {
    return (
      <div className="py-20 flex justify-center">
        <RefreshCw className="animate-spin text-gray-300" size={24} />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-black text-gray-900">Menu Availability</h2>
      {data.categories.map(category => (
        <section key={category.slug}>
          <div
            className="flex items-center justify-center mb-3"
            style={{ background: '#FFC200', borderRadius: 8, padding: '10px 16px' }}
          >
            <h3 className="text-sm font-black text-white uppercase tracking-widest">{category.name}</h3>
          </div>
          <div className="admin-menu-list space-y-2">
            {category.items.map(item => {
              const isSoldOut = data.soldOut.includes(item.uuid)
              return (
                <div
                  key={item.uuid}
                  className="bg-white rounded-xl border border-[#E5E5E5] px-5 py-3.5 flex items-center gap-4"
                >
                  <p className="flex-1 text-sm font-bold text-gray-900 leading-snug">{item.name}</p>
                  <button
                    onClick={() => onToggleSoldOut(item, isSoldOut)}
                    disabled={saving === item.uuid}
                    className={`shrink-0 min-h-10 rounded-lg px-4 text-xs font-black tracking-wide transition-colors disabled:opacity-50 ${
                      isSoldOut
                        ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                        : 'bg-green-50 text-green-800 border border-green-200 hover:bg-green-100'
                    }`}
                  >
                    {isSoldOut ? 'SOLD OUT' : 'AVAILABLE'}
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
