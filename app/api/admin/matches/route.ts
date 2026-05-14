import { adminGuard } from '@/lib/adminGuard'
import { NextResponse } from 'next/server'

export async function GET() {
  const guard = await adminGuard()
  if ('error' in guard) return guard.error
  const { supabase } = guard

  const { data, error } = await supabase
    .from('matches')
    .select('id, status, created_at, punt_code, offer:offers(title, value_gbp, fee_gbp, invite_type, posts_per_month, duration_months), creator:profiles!matches_creator_id_fkey(id, display_name, instagram_handle, follower_count, avatar_url), business:profiles!matches_business_id_fkey(id, business_name, display_name, category, address_line, instagram_handle, website_url, avatar_url)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
