import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/adminAuth'
import { sendTestSms } from '@/lib/sms'
import { hasTrustedOrigin, readJson } from '@/lib/security'

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const username = process.env.CLICKSEND_USERNAME
  const apiKey = process.env.CLICKSEND_API_KEY
  if (!username || !apiKey) {
    return NextResponse.json({ configured: false, authenticated: false })
  }

  const response = await fetch('https://rest.clicksend.com/v3/account', {
    headers: {
      Authorization: `Basic ${Buffer.from(`${username}:${apiKey}`).toString('base64')}`,
    },
    cache: 'no-store',
  })
  const result = await response.json()

  return NextResponse.json({
    configured: true,
    authenticated: response.ok && result?.response_code === 'SUCCESS',
    message: response.ok ? undefined : result?.response_msg || 'ClickSend authentication failed',
  })
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasTrustedOrigin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { phone } = await readJson<{ phone?: string }>(req, 1024)
  if (!phone) return NextResponse.json({ error: 'Missing phone' }, { status: 400 })

  try {
    const result = await sendTestSms(phone)
    return NextResponse.json({ ok: true, messageId: result.messageId })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'SMS failed',
    }, { status: 502 })
  }
}
