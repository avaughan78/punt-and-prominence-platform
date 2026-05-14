import { adminGuard } from '@/lib/adminGuard'
import { NextResponse } from 'next/server'

export async function GET() {
  const guard = await adminGuard()
  if ('error' in guard) return guard.error
  const { supabase } = guard

  const { data, error } = await supabase
    .from('offers')
    .select(`
      id, title, invite_type, value_gbp, fee_gbp, posts_per_month, duration_months,
      slots_total, slots_claimed, is_active, created_at,
      business:profiles!offers_business_id_fkey(id, business_name, display_name, category, address_line, instagram_handle, website_url, avatar_url),
      matches(id, status, created_at, punt_code, creator:profiles!matches_creator_id_fkey(id, display_name, instagram_handle, follower_count, avatar_url))
    `)
    .gt('slots_claimed', 0)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const groups = (data ?? []).filter((o: { matches?: unknown[] }) => (o.matches as unknown[])?.length > 0)
  return NextResponse.json(groups)
}
