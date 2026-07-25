/**
 * Twilio SMS helper (optional). Skips when credentials are missing.
 */

export function isTwilioConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim() &&
      process.env.TWILIO_FROM_NUMBER?.trim()
  )
}

/** Normalize to E.164-ish: digits with leading +. */
export function normalizePhoneE164(raw?: string | null): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  const digits = trimmed.replace(/[^\d+]/g, '')
  if (digits.startsWith('+')) {
    const rest = digits.slice(1).replace(/\D/g, '')
    if (rest.length < 8 || rest.length > 15) return null
    return `+${rest}`
  }
  const only = digits.replace(/\D/g, '')
  if (only.length === 10) return `+1${only}`
  if (only.length >= 8 && only.length <= 15) return `+${only}`
  return null
}

export async function sendSms(input: {
  to: string
  body: string
}): Promise<{ sent: boolean; error?: string }> {
  if (!isTwilioConfigured()) {
    return { sent: false, error: 'Twilio not configured' }
  }
  const to = normalizePhoneE164(input.to)
  if (!to) {
    return { sent: false, error: 'Invalid phone number' }
  }

  const sid = process.env.TWILIO_ACCOUNT_SID!.trim()
  const token = process.env.TWILIO_AUTH_TOKEN!.trim()
  const from = process.env.TWILIO_FROM_NUMBER!.trim()
  const auth = Buffer.from(`${sid}:${token}`).toString('base64')

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: to,
          From: from,
          Body: input.body.slice(0, 320),
        }),
      }
    )
    if (!response.ok) {
      const text = await response.text()
      console.warn('Twilio SMS failed:', response.status, text)
      return { sent: false, error: `Twilio ${response.status}` }
    }
    return { sent: true }
  } catch (error) {
    console.error('Twilio SMS error:', error)
    return { sent: false, error: 'Twilio request failed' }
  }
}
