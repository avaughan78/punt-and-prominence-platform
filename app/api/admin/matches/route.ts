import { adminGuard } from '@/lib/adminGuard'
import { NextResponse } from 'next/server'

export async function GET() {
  const guard = await adminGuard()
  if ('error' in guard) return guard.error
  const { supabase } = guard

  const { data, error } = await supabase
    .from('offers')
    .select(`
      id, title, description, requirements, invite_type, value_gbp, fee_gbp,
      posts_per_month, duration_months, slots_total, slots_claimed, is_active,
      created_at, expires_at,
      business:profiles!offers_business_id_fkey(id, business_name, display_name, category, address_line, instagram_handle, website_url, avatar_url),
      matches(id, status, post_url, created_at, punt_code, creator:profiles!matches_creator_id_fkey(id, display_name, instagram_handle, follower_count, avatar_url))
    `)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
