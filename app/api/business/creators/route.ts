import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.user_metadata?.role !== 'business') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [{ data, error }, { data: nudgeRows }] = await Promise.all([
    supabase
      .from('profiles')
      .select(`
        id, display_name, instagram_handle, avatar_url,
        follower_count, bio, website_url,
        matches:matches!matches_creator_id_fkey(closed_at)
      `)
      .eq('role', 'creator')
      .eq('is_approved', true)
      .order('follower_count', { ascending: false, nullsFirst: false }),
    supabase
      .from('nudges')
      .select('creator_id')
      .eq('business_id', user.id),
  ])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const nudgedSet = new Set((nudgeRows ?? []).map(n => n.creator_id))

  const creators = (data ?? []).map(c => ({
    id: c.id,
    display_name: c.display_name,
    instagram_handle: c.instagram_handle,
    avatar_url: c.avatar_url,
    follower_count: c.follower_count,
    bio: c.bio,
    website_url: c.website_url,
    verified_matches: (c.matches as { closed_at: string | null }[]).filter(m => !!m.closed_at).length,
    total_matches: (c.matches as { closed_at: string | null }[]).length,
    nudged: nudgedSet.has(c.id),
  }))

  return NextResponse.json(creators)
}
