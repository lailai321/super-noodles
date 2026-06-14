import { NextRequest, NextResponse } from 'next/server'
import { sendMessage } from '@/lib/telegram'
import { clientIp, escapeTelegramHtml, hasTrustedOrigin, isRateLimited, readJson } from '@/lib/security'
import { normalizeAustralianPhoneInput } from '@/lib/phone'

export async function POST(req: NextRequest) {
  if (!hasTrustedOrigin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (isRateLimited(`catering:${clientIp(req)}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many enquiries. Please try again later.' }, { status: 429 })
  }

  let input: Record<string, unknown>
  try {
    input = await readJson(req, 12_000)
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  const text = (key: string, max: number) => typeof input[key] === 'string' ? input[key].trim().slice(0, max) : ''
  const name = text('name', 80)
  const phone = normalizeAustralianPhoneInput(text('phone', 30))
  const email = text('email', 254)
  const date = text('date', 20)
  const time = text('time', 20)
  const guests = Number(input.guests)
  const message = text('message', 2000)

  if (
    name.length < 2 || !/^04\d{8}$/.test(phone)
    || !/^\d{4}-\d{2}-\d{2}$/.test(date) || time.length === 0
    || !Number.isInteger(guests) || guests < 1 || guests > 1000
    || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  ) {
    return NextResponse.json({ error: 'Please check the form fields.' }, { status: 400 })
  }

  const msg =
    `<b>CATERING ENQUIRY</b>\n` +
    `Name: ${escapeTelegramHtml(name)}\n` +
    `Phone: ${escapeTelegramHtml(phone)}\n` +
    `Email: ${escapeTelegramHtml(email || 'N/A')}\n` +
    `Event date: ${escapeTelegramHtml(date)}\n` +
    `Event time: ${escapeTelegramHtml(time)}\n` +
    `Guests: ${guests}\n` +
    `Notes: ${escapeTelegramHtml(message || 'N/A')}`

  try {
    await sendMessage(msg)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[Catering] Telegram notification failed:', error)
    return NextResponse.json({ error: 'Could not send enquiry' }, { status: 502 })
  }
}
