import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchCreatorData } from '@/lib/phyllo'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { account_id } = await req.json()
  if (!account_id) return NextResponse.json({ error: 'account_id required' }, { status: 400 })

  try {
    const creatorData = await fetchCreatorData(account_id)

    await supabase.from('profiles').update({
      phyllo_account_id:   account_id,
      instagram_handle:    creatorData.instagram_handle ?? undefined,
      follower_count:      creatorData.follower_count ?? undefined,
      engagement_rate:     creatorData.engagement_rate ?? undefined,
      audience_local_pct:  creatorData.audience_local_pct ?? undefined,
      audience_local_label: creatorData.audience_local_label ?? undefined,
      is_approved:         (creatorData.follower_count ?? 0) >= 1000,
      updated_at:          new Date().toISOString(),
    }).eq('id', user.id)

    return NextResponse.json(creatorData)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Phyllo error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
