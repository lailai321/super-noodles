interface SmsResult {
  messageId: string | null
}

function normalizeAustralianPhone(phone: string) {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('61')) return `+${digits}`
  if (digits.startsWith('0')) return `+61${digits.slice(1)}`
  return `+61${digits}`
}

async function sendSms(phone: string, body: string): Promise<SmsResult> {
  const username = process.env.CLICKSEND_USERNAME
  const apiKey = process.env.CLICKSEND_API_KEY
  if (!username || !apiKey) {
    throw new Error('ClickSend is not configured')
  }

  const response = await fetch('https://rest.clicksend.com/v3/sms/send', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${username}:${apiKey}`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [{
        source: 'sdk',
        body,
        to: normalizeAustralianPhone(phone),
      }],
    }),
  })

  const result = await response.json()
  if (!response.ok || result?.response_code !== 'SUCCESS') {
    throw new Error(result?.response_msg || `ClickSend request failed (${response.status})`)
  }

  const message = result?.data?.messages?.[0]
  if (message?.status && message.status !== 'SUCCESS') {
    throw new Error(message.status)
  }

  return { messageId: message?.message_id || null }
}

export function sendReadySms(phone: string, orderNumber: number) {
  return sendSms(
    phone,
    `Super Noodles: Order #${String(orderNumber).padStart(4, '0')} is ready for pickup at Glenmore Park. Please collect it at the counter.`
  )
}

export function sendTestSms(phone: string) {
  return sendSms(phone, 'Super Noodles SMS test: your order-ready notifications are now connected.')
}
