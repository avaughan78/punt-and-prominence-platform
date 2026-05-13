import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id, display_name, instagram_handle, tiktok_handle,
      avatar_url, follower_count, tiktok_follower_count, bio,
      matches:matches!matches_creator_id_fkey(status)
    `)
    .eq('role', 'creator')
    .eq('is_approved', true)
    .not('instagram_handle', 'is', null)
    .order('follower_count', { ascending: false, nullsFirst: false })
    .limit(12)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const creators = (data ?? []).map(c => ({
    id: c.id,
    display_name: c.display_name,
    instagram_handle: c.instagram_handle,
    tiktok_handle: c.tiktok_handle,
    avatar_url: c.avatar_url,
    follower_count: c.follower_count,
    tiktok_follower_count: c.tiktok_follower_count,
    bio: c.bio,
    verified_matches: (c.matches as { status: string }[]).filter(m => m.status === 'verified').length,
    total_matches: (c.matches as { status: string }[]).length,
  }))

  return NextResponse.json(creators)
}
