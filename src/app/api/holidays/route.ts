import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

function sydneyDateOffset(offset: number) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney' }).format(new Date())
  const [y, m, d] = today.split('-').map(Number)
  const next = new Date(Date.UTC(y, m - 1, d + offset))
  return next.toISOString().slice(0, 10)
}

export async function GET() {
  const today = sydneyDateOffset(0)
  const tomorrow = sydneyDateOffset(1)
  const db = getServiceClient()
  const { data, error } = await db.from('holidays').select('date')
  if (error) {
    return NextResponse.json(
      { today: false, tomorrow: false, _error: error.message, _today: today },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  }
  const dates = (data ?? []).map((r: { date: string }) => r.date)
  return NextResponse.json(
    { today: dates.includes(today), tomorrow: dates.includes(tomorrow), _today: today, _allRows: dates },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
