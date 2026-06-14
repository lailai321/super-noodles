import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { sendMessage } from '@/lib/telegram'
import { findItemByName } from '@/lib/menu'
import { escapeTelegramHtml, readJson, safeEqual, telegramWebhookSecret } from '@/lib/security'

export async function POST(req: NextRequest) {
  const suppliedSecret = req.headers.get('x-telegram-bot-api-secret-token') || ''
  if (!safeEqual(suppliedSecret, telegramWebhookSecret())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { message?: { text?: string; chat?: { id?: string | number } } }
  try {
    body = await readJson(req, 64_000)
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  const msg = body?.message
  if (!msg?.text || !msg?.chat?.id) return NextResponse.json({ ok: true })

  const text: string = msg.text.trim()
  const chatId = String(msg.chat.id)
  const allowedChats = [
    process.env.TELEGRAM_CHAT_ID,
    process.env.TELEGRAM_GROUP_CHAT_ID,
  ].filter(Boolean).map(value => value!.replace(/^\uFEFF/, ''))
  if (!allowedChats.includes(chatId)) return NextResponse.json({ ok: true })
  const db = getServiceClient()

  if (text.startsWith('/soldout ')) {
    const query = text.replace('/soldout ', '').trim()
    const item = findItemByName(query)
    if (!item) {
      await sendMessage(`Item not found: "${escapeTelegramHtml(query)}"\nTip: use /list to see available items`, chatId)
    } else {
      await db.from('sold_out_items').upsert({ item_uuid: item.uuid, item_name: item.name })
      await sendMessage(`Marked as sold out: <b>${item.name}</b>`, chatId)
    }
  } else if (text.startsWith('/available ')) {
    const query = text.replace('/available ', '').trim()
    const item = findItemByName(query)
    if (!item) {
      await sendMessage(`Item not found: "${escapeTelegramHtml(query)}"`, chatId)
    } else {
      await db.from('sold_out_items').delete().eq('item_uuid', item.uuid)
      await sendMessage(`Back in stock: <b>${item.name}</b>`, chatId)
    }
  } else if (text === '/list') {
    const { data } = await db.from('sold_out_items').select('item_name').order('item_name')
    if (!data?.length) {
      await sendMessage('No items currently sold out', chatId)
    } else {
      const list = data.map((row: { item_name: string }) => `- ${escapeTelegramHtml(row.item_name)}`).join('\n')
      await sendMessage(`<b>Currently sold out:</b>\n${list}`, chatId)
    }
  } else if (text === '/chatid') {
    await sendMessage(`Chat ID: <code>${chatId}</code>`, chatId)
  } else if (text === '/help') {
    await sendMessage(
      '<b>Super Noodles Bot Commands</b>\n\n' +
      '/soldout [item name] - Mark item as sold out\n' +
      '/available [item name] - Mark item as available\n' +
      '/list - Show all sold out items\n' +
      '/chatid - Show this chat ID\n' +
      '/help - Show this message',
      chatId
    )
  }

  return NextResponse.json({ ok: true })
}
