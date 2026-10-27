export type CampaignAttribution = {
  campaignSource: string | null
  campaignMedium: string | null
  campaignName: string | null
}

type CampaignAttributionResult =
  | { success: true; data: CampaignAttribution | null }
  | { success: false }

const campaignFieldLimits = {
  source: 100,
  medium: 100,
  campaign: 150
} as const

export function parseCampaignAttribution(value: unknown): CampaignAttributionResult {
  if (value === undefined || value === null) {
    return { success: true, data: null }
  }
  if (typeof value !== 'object' || Array.isArray(value)) {
    return { success: false }
  }

  const input = value as Record<string, unknown>
  const fields = Object.entries(campaignFieldLimits).map(([key, maxLength]) => {
    const candidate = input[key]
    if (candidate === undefined || candidate === null || candidate === '') {
      return [key, null] as const
    }
    if (typeof candidate !== 'string' || candidate.length > maxLength || /[\u0000-\u001f\u007f]/.test(candidate)) {
      return null
    }
    const normalized = candidate.trim()
    return [key, normalized || null] as const
  })
  if (fields.some((field) => field === null)) {
    return { success: false }
  }

  const [campaignSource, campaignMedium, campaignName] = fields.map((field) => field?.[1] ?? null)
  const data = { campaignSource, campaignMedium, campaignName }
  return Object.values(data).some(Boolean)
    ? { success: true, data }
    : { success: true, data: null }
}
