import { adminGuard } from '@/lib/adminGuard'
import { NextResponse } from 'next/server'

export async function GET() {
  const guard = await adminGuard()
  if ('error' in guard) return guard.error
  const { supabase } = guard

  const { data: businesses } = await supabase
    .from('profiles')
    .select('id, display_name, business_name, address_line, category, avatar_url, created_at, website_url, instagram_handle, is_suspended')
    .eq('role', 'business')
    .order('created_at', { ascending: false })

  if (!businesses) return NextResponse.json([])

  // Fetch invite and match stats for each business in one query each
  const ids = businesses.map(b => b.id)

  const { data: offers } = await supabase
    .from('offers')
    .select('id, business_id, is_active')
    .in('business_id', ids)

  const { data: matches } = await supabase
    .from('matches')
    .select('id, business_id, closed_at')
    .in('business_id', ids)

  const enriched = businesses.map(b => ({
    ...b,
    active_invites: offers?.filter(o => o.business_id === b.id && o.is_active).length ?? 0,
    total_matches: matches?.filter(m => m.business_id === b.id).length ?? 0,
    verified_matches: matches?.filter(m => m.business_id === b.id && !!m.closed_at).length ?? 0,
  }))

  return NextResponse.json(enriched)
}
