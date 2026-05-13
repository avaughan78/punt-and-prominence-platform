import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.user_metadata?.role !== 'business') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id, display_name, instagram_handle, avatar_url,
      follower_count, bio, website_url,
      matches:matches!matches_creator_id_fkey(status)
    `)
    .eq('role', 'creator')
    .eq('is_approved', true)
    .order('follower_count', { ascending: false, nullsFirst: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const creators = (data ?? []).map(c => ({
    id: c.id,
    display_name: c.display_name,
    instagram_handle: c.instagram_handle,
    avatar_url: c.avatar_url,
    follower_count: c.follower_count,
    bio: c.bio,
    website_url: c.website_url,
    verified_matches: (c.matches as { status: string }[]).filter(m => m.status === 'verified').length,
    total_matches: (c.matches as { status: string }[]).length,
  }))

  return NextResponse.json(creators)
}
