import { adminGuard } from '@/lib/adminGuard'
import { NextResponse } from 'next/server'

export async function GET() {
  const guard = await adminGuard()
  if ('error' in guard) return guard.error
  const { supabase } = guard

  const [
    { count: totalCreators },
    { count: pendingCreators },
    { count: totalBusinesses },
    { count: totalMatches },
    { count: activeInvites },
    { count: unusedCodes },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'creator'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'creator').eq('is_approved', false),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'business'),
    supabase.from('matches').select('*', { count: 'exact', head: true }),
    supabase.from('offers').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('invite_codes').select('*', { count: 'exact', head: true }).eq('used', false),
  ])

  return NextResponse.json({
    totalCreators: totalCreators ?? 0,
    pendingCreators: pendingCreators ?? 0,
    totalBusinesses: totalBusinesses ?? 0,
    totalMatches: totalMatches ?? 0,
    activeInvites: activeInvites ?? 0,
    unusedCodes: unusedCodes ?? 0,
  })
}
