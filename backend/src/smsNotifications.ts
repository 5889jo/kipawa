type AfricaTalkingConfig = {
  username?: string
  apiKey?: string
  senderId?: string
  defaultCountryCode?: string
  environment?: 'sandbox' | 'production'
}

type SmsSendResult =
  | { status: 'accepted' | 'not_configured' }
  | { status: 'failed'; reason: string }

const statusMessages: Record<string, string> = {
  phone_verified: 'Your phone number was confirmed.',
  contacted: 'The centre is following up on your request.',
  issue_control_number: 'A payment control number was issued.',
  verify_form_fee: 'Your application fee was verified.',
  reject_form_fee: 'Your payment proof needs correction.',
  verify_course_fee: 'Your course fee was verified.',
  request_application_changes: 'Please update your application.',
  decline_application: 'Your application was declined.',
  send_start_date: 'Your course start date was confirmed.'
}

export function formatSmsPhoneNumber(phone: string, defaultCountryCode = '255'): string | null {
  const normalized = phone.trim().replace(/[()\s.-]/g, '')
  if (!/^\+?\d{7,15}$/.test(normalized) && !/^00\d{7,15}$/.test(normalized)) {
    return null
  }
  if (normalized.startsWith('+')) return normalized
  if (normalized.startsWith('00')) return `+${normalized.slice(2)}`
  if (!/^\d{1,3}$/.test(defaultCountryCode)) return null
  if (normalized.startsWith(defaultCountryCode)) return `+${normalized}`
  return `+${defaultCountryCode}${normalized.startsWith('0') ? normalized.slice(1) : normalized}`
}

export function buildCourseStatusSms(courseName: string, action: string): string {
  const course = courseName.trim().replace(/\s+/g, ' ').slice(0, 50) || 'Your course'
  const update = statusMessages[action] ?? 'Your course request has been updated.'
  return `VETA Kipawa: ${course}: ${update} Sign in to your account for details.`
}

export async function sendAfricaTalkingSms(
  phone: string,
  message: string,
  config: AfricaTalkingConfig,
  fetchImpl: typeof fetch = fetch
): Promise<SmsSendResult> {
  const username = config.username?.trim()
  const apiKey = config.apiKey?.trim()
  if (!username && !apiKey) return { status: 'not_configured' }
  if (!username || !apiKey) return { status: 'failed', reason: 'incomplete_configuration' }

  const recipient = formatSmsPhoneNumber(phone, config.defaultCountryCode)
  if (!recipient) return { status: 'failed', reason: 'invalid_phone_number' }

  const body = new URLSearchParams({
    username,
    to: recipient,
    message
  })
  if (config.senderId?.trim()) body.set('from', config.senderId.trim())

  let response: Response
  try {
    const endpoint = config.environment === 'sandbox'
      ? 'https://api.sandbox.africastalking.com/version1/messaging'
      : 'https://api.africastalking.com/version1/messaging'
    response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        apiKey
      },
      body,
      signal: AbortSignal.timeout(8000)
    })
  } catch {
    return { status: 'failed', reason: 'provider_request_failed' }
  }

  if (!response.ok) return { status: 'failed', reason: `provider_http_${response.status}` }

  let result: unknown
  try {
    result = await response.json()
  } catch {
    return { status: 'failed', reason: 'invalid_provider_response' }
  }

  if (!result || typeof result !== 'object') {
    return { status: 'failed', reason: 'invalid_provider_response' }
  }
  const providerResponse = result as {
    SMSMessageData?: {
      Recipients?: Array<{ status?: string; statusCode?: number | string }>
    }
  }
  const recipients = providerResponse.SMSMessageData?.Recipients
  if (!recipients?.length) return { status: 'failed', reason: 'missing_provider_recipient_result' }
  const providerRecipient = recipients.length === 1 ? recipients[0] : null
  if (!providerRecipient || typeof providerRecipient !== 'object' || providerRecipient.status !== 'Success') {
    return { status: 'failed', reason: 'provider_rejected_message' }
  }

  return { status: 'accepted' }
}
