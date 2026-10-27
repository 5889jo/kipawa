import { describe, expect, it } from 'vitest'
import { parseCampaignAttribution } from './campaignAttribution'

describe('campaign attribution', () => {
  it('accepts and trims known campaign fields', () => {
    expect(parseCampaignAttribution({
      source: ' instagram ',
      medium: ' social ',
      campaign: ' october-intake '
    })).toEqual({
      success: true,
      data: {
        campaignSource: 'instagram',
        campaignMedium: 'social',
        campaignName: 'october-intake'
      }
    })
  })

  it('treats missing or empty attribution as absent', () => {
    expect(parseCampaignAttribution(undefined)).toEqual({ success: true, data: null })
    expect(parseCampaignAttribution({ source: ' ', medium: null, campaign: '' }))
      .toEqual({ success: true, data: null })
  })

  it('rejects malformed, overlong, or control-character values', () => {
    expect(parseCampaignAttribution('instagram')).toEqual({ success: false })
    expect(parseCampaignAttribution({ source: 4 })).toEqual({ success: false })
    expect(parseCampaignAttribution({ source: 'x'.repeat(101) })).toEqual({ success: false })
    expect(parseCampaignAttribution({ campaign: 'october\nintake' })).toEqual({ success: false })
  })
})
