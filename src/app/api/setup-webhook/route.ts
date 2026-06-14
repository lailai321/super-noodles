import { NextRequest, NextResponse } from 'next/server'
import { setWebhook } from '@/lib/telegram'
import { isAdminRequest } from '@/lib/adminAuth'
import { hasTrustedOrigin } from '@/lib/security'

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasTrustedOrigin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl?.startsWith('https://')) {
    return NextResponse.json({ error: 'A secure app URL is required' }, { status: 500 })
  }
  const result = await setWebhook(`${appUrl}/api/webhook/telegram`)
  return NextResponse.json(result)
}
