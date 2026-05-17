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
    { count: closedMatches },
    { data: openMatchIds },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'creator'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'creator').eq('is_approved', false),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'business'),
    supabase.from('matches').select('*', { count: 'exact', head: true }),
    supabase.from('offers').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('invite_codes').select('*', { count: 'exact', head: true }).eq('used', false),
    supabase.from('matches').select('*', { count: 'exact', head: true }).not('closed_at', 'is', null),
    supabase.from('matches').select('id').is('closed_at', null),
  ])

  const ids = (openMatchIds ?? []).map((m: { id: string }) => m.id)
  const { count: postsToVerify } = ids.length > 0
    ? await supabase.from('match_deliverables').select('*', { count: 'exact', head: true }).in('match_id', ids).is('verified_at', null)
    : { count: 0 }

  const total = totalMatches ?? 0
  const closed = closedMatches ?? 0

  return NextResponse.json({
    totalCreators: totalCreators ?? 0,
    pendingCreators: pendingCreators ?? 0,
    totalBusinesses: totalBusinesses ?? 0,
    totalMatches: total,
    activeInvites: activeInvites ?? 0,
    unusedCodes: unusedCodes ?? 0,
    closedMatches: closed,
    postsToVerify: postsToVerify ?? 0,
    completionRate: total > 0 ? Math.round((closed / total) * 100) : 0,
  })
}
