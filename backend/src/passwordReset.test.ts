import { describe, expect, it, vi } from 'vitest'
import {
  buildPasswordResetUrl,
  createPasswordResetToken,
  hashPasswordResetToken,
  sendPasswordResetEmail
} from './passwordReset'

describe('password reset helpers', () => {
  it('creates a unique URL-safe token and stores only its SHA-256 digest', () => {
    const first = createPasswordResetToken()
    const second = createPasswordResetToken()

    expect(first.token).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(first.tokenHash).toBe(hashPasswordResetToken(first.token))
    expect(first.tokenHash).not.toContain(first.token)
    expect(second.token).not.toBe(first.token)
  })

  it('builds a reset link with an encoded token', () => {
    expect(buildPasswordResetUrl('https://kipawa.example/', 'abc+123'))
      .toBe('https://kipawa.example/reset-password?token=abc%2B123')
  })

  it('does not send email when Resend credentials are missing', async () => {
    const fetchImpl = vi.fn()

    await expect(sendPasswordResetEmail({
      to: 'learner@example.com',
      name: 'Learner',
      resetUrl: 'https://kipawa.example/reset-password'
    }, fetchImpl)).resolves.toEqual({ status: 'not_configured' })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('sends a reset email through Resend', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 200 }))

    await expect(sendPasswordResetEmail({
      apiKey: 'secret',
      from: 'VETA Kipawa <no-reply@example.com>',
      to: 'learner@example.com',
      name: '<Learner>',
      resetUrl: 'https://kipawa.example/reset-password?token=secret'
    }, fetchImpl)).resolves.toEqual({ status: 'accepted' })
    const [url, options] = fetchImpl.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.resend.com/emails')
    expect(options.headers).toMatchObject({ Authorization: 'Bearer secret' })
    expect(JSON.parse(String(options.body))).toMatchObject({
      to: ['learner@example.com'],
      html: expect.stringContaining('&lt;Learner&gt;')
    })
  })

  it('reports provider delivery failures without throwing', async () => {
    await expect(sendPasswordResetEmail({
      apiKey: 'secret',
      from: 'no-reply@example.com',
      to: 'learner@example.com',
      name: 'Learner',
      resetUrl: 'https://kipawa.example/reset-password'
    }, vi.fn().mockResolvedValue(new Response(null, { status: 503 }))))
      .resolves.toEqual({ status: 'failed', reason: 'provider_http_503' })
  })
})
