'use strict'
const net   = require('net')
const https = require('https')

// ─── Config ──────────────────────────────────────────────────────────────────
const PRINT_SECRET   = 'uDQlQ585FhAx9J2FJ1O37bRln8xtoawz'
const API_HOST       = 'www.supernoodlesonline.com.au'
const PRINTER_HOST   = '192.168.0.87'
const PRINTER_PORT   = 9100
const POLL_MS        = 5000
const LINE_CHARS     = 48          // 80mm paper, Font A (48 chars/line)
const PRINTER_TIMEOUT_MS = 10000

// ─── ESC/POS commands ────────────────────────────────────────────────────────
const ESC = 0x1B
const GS  = 0x1D

function b(...bytes) { return Buffer.from(bytes) }

const CMD = {
  init:       () => b(ESC, 0x40),           // reset printer
  fontA:      () => b(ESC, 0x4D, 0x00),     // Font A: standard width, 48 chars/line
  fontB:      () => b(ESC, 0x4D, 0x01),     // Font B: narrower, more chars/line
  center:     () => b(ESC, 0x61, 0x01),     // center align
  left:       () => b(ESC, 0x61, 0x00),     // left align
  boldOn:     () => b(ESC, 0x45, 0x01),
  boldOff:    () => b(ESC, 0x45, 0x00),
  dblSize:    () => b(GS,  0x21, 0x11),     // double width + height (shop name)
  dblHeight:  () => b(GS,  0x21, 0x01),     // double height only (body text)
  normalSize: () => b(GS,  0x21, 0x00),     // normal (dividers, notes)
  feed:       (n) => b(ESC, 0x64, n),       // feed n lines
  cut:        () => b(GS,  0x56, 0x42, 0x00), // partial cut
}

function txt(s)          { return Buffer.from(s + '\n', 'latin1') }
function div(ch = '-')   { return txt(ch.repeat(LINE_CHARS)) }
function blank()         { return txt('') }
function rAlign(left, right) {
  const gap = LINE_CHARS - left.length - right.length
  return left + (gap > 0 ? ' '.repeat(gap) : ' ') + right
}

// ─── Gift rules (mirror of src/lib/giftRules.ts) ─────────────────────────────
function getOrderGifts(totalCents) {
  if (totalCents >= 15000) return ['6pc Spring Rolls', '1x 1.25L Coke']
  if (totalCents >= 6000)  return ['4pc Spring Rolls']
  return []
}

// ─── Format helpers ───────────────────────────────────────────────────────────
function sydneyTime(iso) {
  return new Date(iso).toLocaleTimeString('en-AU', {
    timeZone: 'Australia/Sydney',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
}

// ─── Build ESC/POS receipt buffer ────────────────────────────────────────────
function buildReceipt(order) {
  const p = []

  p.push(CMD.init(), CMD.fontA())

  // ── Header ──
  p.push(CMD.center(), CMD.boldOn(), CMD.dblSize())
  p.push(txt('SUPER NOODLES'))
  p.push(CMD.dblHeight())
  p.push(txt('GLENMORE PARK'))
  p.push(CMD.boldOff(), CMD.normalSize(), CMD.left())
  p.push(div('='))

  // ── Order info ──
  p.push(CMD.boldOn())
  p.push(txt('Order #' + String(order.order_number).padStart(4, '0')))
  p.push(CMD.boldOff(), CMD.dblHeight())
  p.push(txt('Time:   ' + sydneyTime(order.created_at)))
  p.push(txt('Pickup: ' + (order.pickup_time === 'asap' ? 'ASAP (~15 min)' : order.pickup_time)))
  p.push(CMD.normalSize())
  p.push(div('-'))

  // ── Items ──
  for (const item of order.order_items) {
    const lineTotal = '$' + ((item.unit_price_cents * item.quantity) / 100).toFixed(2)
    const nameLabel = 'x' + item.quantity + '  ' + item.item_name

    // Item name + price — Font A + dblHeight + bold
    p.push(CMD.dblHeight(), CMD.boldOn())
    p.push(txt(rAlign(nameLabel, lineTotal)))
    p.push(CMD.normalSize())

    // Options — normalSize + bold
    if (item.notes) {
      for (const part of item.notes.split(' | ')) {
        if (part.startsWith('Flavours:')) {
          part.slice('Flavours: '.length).split(', ').filter(Boolean)
            .forEach(f => p.push(txt('   - ' + f)))
        } else if (part.startsWith('NOTE:')) {
          p.push(txt('   Note: ' + part.slice(5).trim()))
        } else {
          part.split(', ').filter(Boolean)
            .forEach(opt => p.push(txt('   - ' + opt)))
        }
      }
    }

    if (item.extra_meat)      p.push(txt(rAlign('   + EXTRA MEAT', '$3.00')))
    if (item.extra_vegetable) p.push(txt(rAlign('   + EXTRA VEG',  '$3.00')))

    p.push(CMD.boldOff())

    p.push(blank())  // blank line between items
  }

  // ── Free gifts ──
  const gifts = getOrderGifts(order.total_cents)
  if (gifts.length > 0) {
    p.push(div('-'))
    p.push(CMD.dblHeight(), CMD.boldOn())
    p.push(txt('** FREE GIFT **'))
    p.push(CMD.boldOff(), CMD.normalSize())
    gifts.forEach(g => p.push(txt('  ' + g)))
  }

  p.push(div('-'))

  // ── Total ──
  p.push(CMD.dblHeight(), CMD.boldOn())
  p.push(txt(rAlign('TOTAL:', '$' + (order.total_cents / 100).toFixed(2))))
  p.push(CMD.boldOff(), CMD.normalSize())
  p.push(div('-'))

  // ── Customer ──
  const maskedPhone = '****' + order.customer_phone.slice(-4)
  p.push(CMD.dblHeight())
  p.push(txt('Name:  ' + order.customer_name))
  p.push(CMD.normalSize())
  p.push(txt('Phone: ' + maskedPhone))
  p.push(div('='))

  // ── Footer ──
  p.push(CMD.center(), CMD.boldOn(), CMD.dblHeight())
  p.push(txt('** PLEASE PREPARE **'))
  p.push(CMD.boldOff(), CMD.normalSize(), CMD.left())
  p.push(div('='))

  p.push(CMD.feed(4))
  p.push(CMD.cut())

  return Buffer.concat(p)
}

// ─── TCP send to printer ──────────────────────────────────────────────────────
function sendToPrinter(data) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket()
    const timer  = setTimeout(() => {
      socket.destroy()
      reject(new Error('Printer connection timeout'))
    }, PRINTER_TIMEOUT_MS)

    socket.connect(PRINTER_PORT, PRINTER_HOST, () => {
      socket.write(data, err => {
        if (err) { clearTimeout(timer); socket.destroy(); reject(err); return }
        socket.end()
      })
    })

    socket.on('close', () => { clearTimeout(timer); resolve() })
    socket.on('error', err => { clearTimeout(timer); reject(err) })
  })
}

// ─── HTTPS helpers ────────────────────────────────────────────────────────────
function apiRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null
    const opts = {
      hostname: API_HOST,
      port: 443,
      path,
      method,
      headers: {
        'x-print-secret': PRINT_SECRET,
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    }
    const req = https.request(opts, res => {
      let raw = ''
      res.on('data', c => { raw += c })
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }) }
        catch { resolve({ status: res.statusCode, body: raw }) }
      })
    })
    req.on('error', reject)
    if (payload) req.write(payload)
    req.end()
  })
}

// ─── Poll loop ────────────────────────────────────────────────────────────────
async function poll() {
  let result
  try {
    result = await apiRequest('GET', '/api/print-queue', null)
  } catch (err) {
    console.error('[poll] Network error:', err.message)
    return
  }

  if (result.status === 401) {
    console.error('[poll] PRINT_SECRET rejected — check config and restart')
    return
  }
  if (result.status !== 200) {
    console.error('[poll] API error:', result.status, result.body)
    return
  }

  const orders = result.body.orders || []
  if (orders.length === 0) return

  console.log('[poll]', orders.length, 'order(s) to print')

  for (const order of orders) {
    const tag = '#' + String(order.order_number).padStart(4, '0')
    try {
      await sendToPrinter(buildReceipt(order))
      console.log('[print]', tag, '→ printer OK')
    } catch (err) {
      console.error('[print]', tag, 'FAILED:', err.message, '— will retry next poll')
      continue
    }

    try {
      await apiRequest('POST', '/api/print-queue/mark-printed', { orderId: order.id })
      console.log('[done]', tag, 'marked printed')
    } catch (err) {
      // Non-critical — order will re-print next poll if this fails
      console.error('[mark-printed]', tag, err.message)
    }
  }
}

module.exports = { buildReceipt, sendToPrinter }

// ─── Start ────────────────────────────────────────────────────────────────────
// Only auto-run the live poll loop when launched directly (e.g. via start.bat),
// not when required by a test script like test-print.js.
if (require.main === module) {
  console.log('╔══════════════════════════════════════════╗')
  console.log('║   Super Noodles — Auto Print Service     ║')
  console.log('╚══════════════════════════════════════════╝')
  console.log('API:     https://' + API_HOST)
  console.log('Printer: ' + PRINTER_HOST + ':' + PRINTER_PORT)
  console.log('Polling: every ' + (POLL_MS / 1000) + 's')
  console.log('')

  poll()
  setInterval(poll, POLL_MS)
}
