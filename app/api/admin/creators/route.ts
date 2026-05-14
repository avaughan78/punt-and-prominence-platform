import { adminGuard } from '@/lib/adminGuard'
import { NextResponse } from 'next/server'

export async function GET() {
  const guard = await adminGuard()
  if ('error' in guard) return guard.error
  const { supabase } = guard

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, instagram_handle, tiktok_handle, follower_count, tiktok_follower_count, is_approved, created_at, bio, website_url, avatar_url')
    .eq('role', 'creator')
    .order('is_approved', { ascending: true })
    .order('created_at', { ascending: false })

  if (!profiles?.length) return NextResponse.json([])

  const [{ data: { users } }, { data: matchRows }] = await Promise.all([
    supabase.auth.admin.listUsers({ perPage: 1000 }),
    supabase.from('matches').select('creator_id').in('creator_id', profiles.map(p => p.id)),
  ])

  const emailMap = Object.fromEntries(users.map(u => [u.id, u.email ?? null]))
  const matchCounts = (matchRows ?? []).reduce<Record<string, number>>((acc, m) => {
    acc[m.creator_id] = (acc[m.creator_id] ?? 0) + 1
    return acc
  }, {})

  return NextResponse.json(profiles.map(p => ({
    ...p,
    email: emailMap[p.id] ?? null,
    match_count: matchCounts[p.id] ?? 0,
  })))
}
