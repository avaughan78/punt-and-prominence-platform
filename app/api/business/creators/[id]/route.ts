import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.user_metadata?.role !== 'business') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  const { data: creator, error } = await supabase
    .from('profiles')
    .select(`
      id, display_name, instagram_handle, tiktok_handle, avatar_url,
      follower_count, tiktok_follower_count, bio, website_url,
      matches:matches!matches_creator_id_fkey(
        id, status, created_at,
        offer:offers(title, value_gbp, fee_gbp, invite_type, category)
      )
    `)
    .eq('id', id)
    .eq('role', 'creator')
    .eq('is_approved', true)
    .single()

  if (error || !creator) return NextResponse.json({ error: 'Creator not found' }, { status: 404 })

  return NextResponse.json(creator)
}
