const stripBOM = (s: string) => s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s
const BOT_TOKEN = stripBOM(process.env.TELEGRAM_BOT_TOKEN!)
const DEFAULT_CHAT_ID = stripBOM(process.env.TELEGRAM_CHAT_ID!)
const ORDER_CHAT_ID = process.env.TELEGRAM_GROUP_CHAT_ID
  ? stripBOM(process.env.TELEGRAM_GROUP_CHAT_ID)
  : DEFAULT_CHAT_ID
const BASE = `https://api.telegram.org/bot${BOT_TOKEN}`

export async function sendMessage(text: string, chatId = DEFAULT_CHAT_ID) {
  const res = await fetch(`${BASE}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })
  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`Telegram sendMessage failed (${res.status}): ${detail}`)
  }
}

export async function sendOrderMessage(text: string) {
  return sendMessage(text, ORDER_CHAT_ID)
}

export async function setWebhook(url: string) {
  const res = await fetch(`${BASE}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, secret_token: telegramWebhookSecret() }),
  })
  return res.json()
}
import { telegramWebhookSecret } from '@/lib/security'
