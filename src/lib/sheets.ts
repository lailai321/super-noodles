import { google } from 'googleapis'
import { getOrderGifts } from '@/lib/giftRules'

const HEADERS = ['日期时间', '订单号', '菜品明细', '赠品', '总价', '姓名', '电话', '取餐时间', '支付状态']

function getPrivateKey(): string {
  let key = process.env.GOOGLE_PRIVATE_KEY || ''
  // Strip surrounding quotes (common Vercel paste mistake)
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1)
  }
  // Convert literal \n to real newlines (Vercel stores them as-is)
  key = key.replace(/\\n/g, '\n')
  return key
}

function getAuth() {
  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
    key: getPrivateKey(),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}

export async function appendOrderToSheet(order: {
  created_at: string
  order_number: number
  order_items: {
    quantity: number
    item_name: string
    extra_meat: boolean
    extra_vegetable: boolean
    notes: string
    unit_price_cents: number
  }[]
  total_cents: number
  customer_name: string
  customer_phone: string
  pickup_time: string
  status: string
}) {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID
  if (!spreadsheetId) return

  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })

  // 第一次写入时自动加表头
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'A1',
  })
  if (!existing.data.values?.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'A1',
      valueInputOption: 'RAW',
      requestBody: { values: [HEADERS] },
    })
  }

  const orderTime = new Date(order.created_at).toLocaleString('en-AU', {
    timeZone: 'Australia/Sydney',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  })

  const itemLines = order.order_items.map(i => {
    const extras = [
      i.extra_meat ? '+Extra Meat' : '',
      i.extra_vegetable ? '+Extra Veg' : '',
    ].filter(Boolean).join(' ')
    const note = i.notes ? ` (${i.notes})` : ''
    return `x${i.quantity} ${i.item_name}${extras ? ' ' + extras : ''}${note}`
  }).join('\n')

  const total = order.total_cents / 100
  const gifts = getOrderGifts(order.total_cents).join(', ')

  const row = [
    orderTime,
    String(order.order_number).padStart(4, '0'),
    itemLines,
    gifts,
    `$${total.toFixed(2)}`,
    order.customer_name,
    order.customer_phone,
    order.pickup_time === 'asap' ? '~12 min (ASAP)' : order.pickup_time,
    order.status,
  ]

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'A:I',
    valueInputOption: 'RAW',
    requestBody: { values: [row] },
  })
}
