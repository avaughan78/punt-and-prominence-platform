const BASE =
  process.env.PHYLLO_ENV === 'production'
    ? 'https://api.getphyllo.com'
    : 'https://api.sandbox.getphyllo.com'

function auth() {
  const encoded = Buffer.from(
    `${process.env.PHYLLO_CLIENT_ID}:${process.env.PHYLLO_CLIENT_SECRET}`
  ).toString('base64')
  return `Basic ${encoded}`
}

async function api(path: string, init: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: auth(),
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`Phyllo ${path} → ${res.status}: ${text}`)
  }
  return res.json()
}

export async function getOrCreateUser(externalId: string, name: string): Promise<string> {
  // Search for existing user first
  try {
    const result = await api(`/v1/users?external_id=${encodeURIComponent(externalId)}&limit=1`)
    if (result?.data?.length > 0) return result.data[0].id
  } catch {
    // fall through to create
  }
  const created = await api('/v1/users', {
    method: 'POST',
    body: JSON.stringify({ name, external_id: externalId }),
  })
  return created.id
}

export async function createSdkToken(phylloUserId: string): Promise<string> {
  const result = await api('/v1/sdk-tokens', {
    method: 'POST',
    body: JSON.stringify({
      user_id: phylloUserId,
      products: ['IDENTITY', 'ENGAGEMENT', 'ENGAGEMENT.AUDIENCE'],
    }),
  })
  return result.sdk_token
}

export interface CreatorData {
  instagram_handle: string | null
  follower_count: number | null
  engagement_rate: number | null
  audience_local_pct: number | null
  audience_local_label: 'cambridge' | 'uk' | null
}

export async function fetchCreatorData(accountId: string): Promise<CreatorData> {
  const [profileRes, audienceRes] = await Promise.allSettled([
    api(`/v1/profiles?account_id=${accountId}&limit=1`),
    api(`/v1/audience-demographics?account_id=${accountId}&limit=1`),
  ])

  const profile = profileRes.status === 'fulfilled' ? profileRes.value?.data?.[0] : null
  const audience = audienceRes.status === 'fulfilled' ? audienceRes.value?.data?.[0] : null

  const follower_count: number | null = profile?.follower_count ?? null
  const raw_engagement: number | null = profile?.engagement_rate ?? null
  // Phyllo returns engagement as a decimal (e.g. 0.045 = 4.5%) — normalise to percentage
  const engagement_rate = raw_engagement != null ? parseFloat((raw_engagement * 100).toFixed(2)) : null

  const instagram_handle: string | null = profile?.platform_username ?? null

  // Prefer Cambridge city; fall back to UK country percentage
  const cities: Array<{ name: string; percentage: number }> = audience?.audience_cities ?? []
  const countries: Array<{ code: string; percentage: number }> = audience?.audience_countries ?? []

  const cambridgeEntry = cities.find(c => c.name?.toLowerCase().includes('cambridge'))
  const ukEntry = countries.find(c => c.code === 'GB')

  let audience_local_pct: number | null = null
  let audience_local_label: 'cambridge' | 'uk' | null = null

  if (cambridgeEntry) {
    audience_local_pct = Math.round(cambridgeEntry.percentage * 100)
    audience_local_label = 'cambridge'
  } else if (ukEntry) {
    audience_local_pct = Math.round(ukEntry.percentage * 100)
    audience_local_label = 'uk'
  }

  return { instagram_handle, follower_count, engagement_rate, audience_local_pct, audience_local_label }
}
