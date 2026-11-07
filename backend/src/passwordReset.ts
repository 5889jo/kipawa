import { createHash, randomBytes } from 'node:crypto'

export type PasswordResetEmailResult =
  | { status: 'accepted' }
  | { status: 'not_configured' }
  | { status: 'failed'; reason: string }

export function createPasswordResetToken() {
  const token = randomBytes(32).toString('base64url')
  const tokenHash = hashPasswordResetToken(token)
  return { token, tokenHash }
}

export function hashPasswordResetToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex')
}

export function buildPasswordResetUrl(frontendOrigin: string, token: string): string {
  const url = new URL('/reset-password', frontendOrigin)
  url.searchParams.set('token', token)
  return url.toString()
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character] ?? character)
}

export async function sendPasswordResetEmail(
  options: {
    apiKey?: string
    from?: string
    to: string
    name: string
    resetUrl: string
  },
  fetchImpl: typeof fetch = fetch
): Promise<PasswordResetEmailResult> {
  const apiKey = options.apiKey?.trim()
  const from = options.from?.trim()
  if (!apiKey || !from) return { status: 'not_configured' }

  const greetingName = escapeHtml(options.name.trim() || 'there')
  const resetUrl = escapeHtml(options.resetUrl)
  let response: Response
  try {
    response = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to: [options.to],
        subject: 'Reset your VETA Kipawa account password',
        text: `Hello ${options.name.trim() || 'there'},\n\nUse this link within 30 minutes to reset your VETA Kipawa account password:\n${options.resetUrl}\n\nIf you did not request this, you can ignore this email.`,
        html: `<p>Hello ${greetingName},</p><p>Use the link below within 30 minutes to reset your VETA Kipawa account password:</p><p><a href="${resetUrl}">Reset your password</a></p><p>If you did not request this, you can ignore this email.</p>`
      }),
      signal: AbortSignal.timeout(8000)
    })
  } catch {
    return { status: 'failed', reason: 'provider_request_failed' }
  }

  if (!response.ok) return { status: 'failed', reason: `provider_http_${response.status}` }
  return { status: 'accepted' }
}
