import { adminGuard } from '@/lib/adminGuard'
import { NextResponse } from 'next/server'

export async function GET() {
  const guard = await adminGuard()
  if ('error' in guard) return guard.error
  const { supabase } = guard

  const { data } = await supabase
    .from('profiles')
    .select('id, display_name, instagram_handle, follower_count, is_approved, created_at, bio, website_url, avatar_url')
    .eq('role', 'creator')
    .order('is_approved', { ascending: true })
    .order('created_at', { ascending: false })

  return NextResponse.json(data ?? [])
}
