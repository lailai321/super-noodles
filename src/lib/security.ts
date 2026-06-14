import { createHash, timingSafeEqual } from 'crypto'
import type { NextRequest } from 'next/server'

type RateEntry = { count: number; resetAt: number }

const rateStore = new Map<string, RateEntry>()

export function clientIp(req: NextRequest) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown'
}

export function isRateLimited(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  if (rateStore.size > 10_000) {
    for (const [storedKey, entry] of rateStore) {
      if (entry.resetAt <= now) rateStore.delete(storedKey)
    }
  }
  const current = rateStore.get(key)
  if (!current || current.resetAt <= now) {
    rateStore.set(key, { count: 1, resetAt: now + windowMs })
    return false
  }
  current.count += 1
  return current.count > limit
}

export function hasTrustedOrigin(req: NextRequest) {
  const origin = req.headers.get('origin')
  if (!origin) return true

  const allowed = new Set<string>()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (appUrl) {
    try {
      const configured = new URL(appUrl)
      allowed.add(configured.origin)
      configured.hostname = configured.hostname.startsWith('www.')
        ? configured.hostname.slice(4)
        : `www.${configured.hostname}`
      allowed.add(configured.origin)
    } catch { /* invalid configuration */ }
  }
  if (process.env.VERCEL_URL) allowed.add(`https://${process.env.VERCEL_URL}`)
  if (process.env.NODE_ENV !== 'production') {
    allowed.add('http://localhost:3000')
    allowed.add('http://127.0.0.1:3000')
  }
  return allowed.has(origin)
}

export async function readJson<T>(req: NextRequest, maxBytes = 16_384): Promise<T> {
  const length = Number(req.headers.get('content-length') || 0)
  if (length > maxBytes) throw new Error('PAYLOAD_TOO_LARGE')
  const text = await req.text()
  if (Buffer.byteLength(text, 'utf8') > maxBytes) throw new Error('PAYLOAD_TOO_LARGE')
  return JSON.parse(text) as T
}

export function safeEqual(a: string, b: string) {
  const left = createHash('sha256').update(a).digest()
  const right = createHash('sha256').update(b).digest()
  return timingSafeEqual(left, right)
}

export function escapeTelegramHtml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export function telegramWebhookSecret() {
  const token = process.env.TELEGRAM_BOT_TOKEN?.replace(/^\uFEFF/, '') || ''
  return createHash('sha256').update(token).digest('hex')
}
