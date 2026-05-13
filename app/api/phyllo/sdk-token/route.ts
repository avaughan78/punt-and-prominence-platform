import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrCreateUser, createSdkToken } from '@/lib/phyllo'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, phyllo_user_id')
    .eq('id', user.id)
    .single()

  try {
    const phylloUserId = await getOrCreateUser(user.id, profile?.display_name ?? user.email ?? user.id)
    const sdkToken = await createSdkToken(phylloUserId)

    // Persist phyllo_user_id if not already stored
    if (!profile?.phyllo_user_id) {
      await supabase.from('profiles').update({ phyllo_user_id: phylloUserId }).eq('id', user.id)
    }

    return NextResponse.json({ sdk_token: sdkToken, phyllo_user_id: phylloUserId })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Phyllo error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
