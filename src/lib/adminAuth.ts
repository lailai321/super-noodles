import { createHmac, timingSafeEqual } from 'crypto'
import type { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'sn_admin_session'
const SESSION_SECONDS = 180 * 24 * 60 * 60

function secret() {
  return process.env.ADMIN_PASSWORD || ''
}

function signature(expiresAt: string) {
  return createHmac('sha256', secret()).update(expiresAt).digest('hex')
}

export function createAdminSession() {
  const expiresAt = String(Math.floor(Date.now() / 1000) + SESSION_SECONDS)
  return `${expiresAt}.${signature(expiresAt)}`
}

export function isAdminSessionValid(value?: string) {
  if (!value || !secret()) return false
  const [expiresAt, supplied] = value.split('.')
  const expiry = Number(expiresAt)
  const now = Math.floor(Date.now() / 1000)
  if (!expiresAt || !supplied || !Number.isSafeInteger(expiry) || expiry <= now) return false

  const expected = Buffer.from(signature(expiresAt))
  const actual = Buffer.from(supplied)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

export function isAdminRequest(req: NextRequest) {
  return isAdminSessionValid(req.cookies.get(COOKIE_NAME)?.value)
}

export function setAdminCookie(res: NextResponse) {
  res.cookies.set(COOKIE_NAME, createAdminSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_SECONDS,
  })
}

export function clearAdminCookie(res: NextResponse) {
  res.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  })
}
