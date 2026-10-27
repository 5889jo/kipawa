import { describe, expect, it, vi } from 'vitest'
import { buildCourseStatusSms, formatSmsPhoneNumber, sendAfricaTalkingSms } from './smsNotifications'

describe('course status SMS', () => {
  it('formats Tanzanian mobile numbers and preserves international numbers', () => {
    expect(formatSmsPhoneNumber('0712 345 678')).toBe('+255712345678')
    expect(formatSmsPhoneNumber('255 712 345 678')).toBe('+255712345678')
    expect(formatSmsPhoneNumber('+254 712 345 678')).toBe('+254712345678')
    expect(formatSmsPhoneNumber('0712 345 678', '254')).toBe('+254712345678')
    expect(formatSmsPhoneNumber('not a phone')).toBeNull()
  })

  it('includes the course and an action-specific next step in the SMS', () => {
    expect(buildCourseStatusSms('  Electrical   Installation ', 'request_application_changes'))
      .toBe('VETA Kipawa: Electrical Installation: Please update your application. Sign in to your account for details.')
  })

  it('does not call the provider without credentials', async () => {
    const fetchImpl = vi.fn<typeof fetch>()
    await expect(sendAfricaTalkingSms('0712345678', 'update', {}, fetchImpl))
      .resolves.toEqual({ status: 'not_configured' })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('sends a form-encoded message and reports provider acceptance', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      SMSMessageData: {
        Recipients: [{ statusCode: 101, status: 'Success' }]
      }
    }), { status: 200 }))

    await expect(sendAfricaTalkingSms('0712345678', 'Progress updated', {
      username: 'kipawa',
      apiKey: 'test-key',
      senderId: 'KIPAWA',
      environment: 'sandbox'
    }, fetchImpl)).resolves.toEqual({ status: 'accepted' })

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.sandbox.africastalking.com/version1/messaging',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ apiKey: 'test-key' }),
        body: new URLSearchParams({
          username: 'kipawa',
          to: '+255712345678',
          message: 'Progress updated',
          from: 'KIPAWA'
        })
      })
    )
  })

  it('uses the live API endpoint unless sandbox mode is explicitly configured', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      SMSMessageData: { Recipients: [{ status: 'Success' }] }
    }), { status: 200 }))

    await sendAfricaTalkingSms('0712345678', 'Progress updated', {
      username: 'kipawa',
      apiKey: 'test-key'
    }, fetchImpl)

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.africastalking.com/version1/messaging',
      expect.any(Object)
    )
  })

  it('reports incomplete configuration and provider failures without claiming delivery', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response('unavailable', { status: 503 }))
    await expect(sendAfricaTalkingSms('0712345678', 'update', { username: 'kipawa' }, fetchImpl))
      .resolves.toEqual({ status: 'failed', reason: 'incomplete_configuration' })
    await expect(sendAfricaTalkingSms('0712345678', 'update', {
      username: 'kipawa',
      apiKey: 'test-key'
    }, fetchImpl)).resolves.toEqual({ status: 'failed', reason: 'provider_http_503' })
  })

  it('rejects malformed or provider-rejected recipient results', async () => {
    for (const responseBody of [
      JSON.stringify({ SMSMessageData: { Recipients: [null] } }),
      JSON.stringify({ SMSMessageData: { Recipients: [{ status: 'Failed' }] } })
    ]) {
      const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response(responseBody, { status: 200 }))
      await expect(sendAfricaTalkingSms('0712345678', 'update', {
        username: 'kipawa',
        apiKey: 'test-key'
      }, fetchImpl)).resolves.toEqual({ status: 'failed', reason: 'provider_rejected_message' })
    }
  })
})
