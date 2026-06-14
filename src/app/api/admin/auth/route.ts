import { NextRequest, NextResponse } from 'next/server'
import { clearAdminCookie, isAdminRequest, setAdminCookie } from '@/lib/adminAuth'
import { clientIp, isRateLimited, readJson, safeEqual } from '@/lib/security'

export async function GET(req: NextRequest) {
  return NextResponse.json({ authenticated: isAdminRequest(req) })
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req)

  let password = ''
  try {
    const input = await readJson<{ password?: string }>(req, 1024)
    password = input.password || ''
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  const expected = process.env.ADMIN_PASSWORD || ''
  if (expected && typeof password === 'string' && safeEqual(password, expected)) {
    const res = NextResponse.json({ ok: true })
    setAdminCookie(res)
    return res
  }
  if (isRateLimited(`admin-login:${ip}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many attempts. Please wait 15 minutes.' }, { status: 429 })
  }
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  clearAdminCookie(res)
  return res
}
