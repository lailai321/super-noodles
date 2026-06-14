export function normalizeAustralianPhoneInput(phone: string) {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('61') && digits.length >= 11) return `0${digits.slice(2)}`
  return digits
}

export function phoneSearchVariants(phone: string) {
  const normalized = normalizeAustralianPhoneInput(phone)
  const variants = new Set([phone.trim(), normalized])
  if (normalized.length === 10 && normalized.startsWith('04')) {
    variants.add(`${normalized.slice(0, 4)} ${normalized.slice(4, 7)} ${normalized.slice(7)}`)
    variants.add(`${normalized.slice(0, 4)}-${normalized.slice(4, 7)}-${normalized.slice(7)}`)
    variants.add(`+61${normalized.slice(1)}`)
  }
  return [...variants].filter(Boolean)
}

