import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { deriveMatchState } from '@/lib/types'

async function getStats(supabase: ReturnType<typeof createAdminClient>) {
  const [
    { count: totalCreators },
    { count: pendingCreators },
    { count: totalBusinesses },
    { count: totalMatches },
    { count: activeInvites },
    { count: unusedCodes },
    { count: waitlistCount },
    { count: closedMatches },
    { data: openMatchIds },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'creator'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'creator').eq('is_approved', false),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'business'),
    supabase.from('matches').select('*', { count: 'exact', head: true }),
    supabase.from('offers').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('invite_codes').select('*', { count: 'exact', head: true }).eq('used', false),
    supabase.from('waitlist').select('*', { count: 'exact', head: true }),
    supabase.from('matches').select('*', { count: 'exact', head: true }).not('closed_at', 'is', null),
    supabase.from('matches').select('id').is('closed_at', null),
  ])

  const ids = (openMatchIds ?? []).map((m: { id: string }) => m.id)
  const { count: postsToVerify } = ids.length > 0
    ? await supabase.from('match_deliverables').select('*', { count: 'exact', head: true }).in('match_id', ids).is('verified_at', null)
    : { count: 0 }

  return {
    totalCreators: totalCreators ?? 0,
    pendingCreators: pendingCreators ?? 0,
    totalBusinesses: totalBusinesses ?? 0,
    totalMatches: totalMatches ?? 0,
    activeInvites: activeInvites ?? 0,
    unusedCodes: unusedCodes ?? 0,
    waitlistCount: waitlistCount ?? 0,
    closedMatches: closedMatches ?? 0,
    postsToVerify: postsToVerify ?? 0,
  }
}

async function getRecentMatches(supabase: ReturnType<typeof createAdminClient>) {
  const { data } = await supabase
    .from('matches')
    .select('id, closed_at, created_at, punt_code, offer:offers(title), creator:profiles!matches_creator_id_fkey(display_name,instagram_handle), business:profiles!matches_business_id_fkey(business_name), deliverables:match_deliverables(verified_at)')
    .order('created_at', { ascending: false })
    .limit(10)
  return data ?? []
}

const STATE_COLOUR: Record<string, string> = {
  in_progress:  '#F5B800',
  needs_review: '#C084FC',
  up_to_date:   '#22c55e',
  closed:       '#94a3b8',
}

const STATE_LABEL: Record<string, string> = {
  in_progress:  'In progress',
  needs_review: 'Needs review',
  up_to_date:   'Up to date',
  closed:       'Closed',
}

export default async function AdminOverview() {
  const supabase = createAdminClient()
  const [stats, recentMatches] = await Promise.all([getStats(supabase), getRecentMatches(supabase)])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Overview</h1>
        <p className="text-sm text-gray-500 mt-0.5">Platform health at a glance.</p>
      </div>

      {stats.pendingCreators > 0 && (
        <Link href="/admin/creators">
          <div className="flex items-center gap-3 rounded-2xl px-4 py-3 mb-3 cursor-pointer hover:opacity-90 transition-opacity" style={{ background: 'rgba(245,184,0,0.1)', border: '1.5px solid rgba(245,184,0,0.3)' }}>
            <span className="text-sm font-semibold text-[#1C2B3A]">
              {stats.pendingCreators} creator{stats.pendingCreators !== 1 ? 's' : ''} awaiting approval
            </span>
            <span className="text-xs font-semibold text-[#F5B800] ml-auto">Review →</span>
          </div>
        </Link>
      )}
      {stats.postsToVerify > 0 && (
        <Link href="/admin/collabs">
          <div className="flex items-center gap-3 rounded-2xl px-4 py-3 mb-6 cursor-pointer hover:opacity-90 transition-opacity" style={{ background: 'rgba(192,132,252,0.08)', border: '1.5px solid rgba(192,132,252,0.3)' }}>
            <span className="text-sm font-semibold text-[#1C2B3A]">
              {stats.postsToVerify} post{stats.postsToVerify !== 1 ? 's' : ''} awaiting verification
            </span>
            <span className="text-xs font-semibold" style={{ color: '#9333ea', marginLeft: 'auto' }}>View →</span>
          </div>
        </Link>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        {([
          { label: 'Waitlist', value: stats.waitlistCount, href: '/admin/waitlist' },
          { label: 'Creators', value: stats.totalCreators, sub: stats.pendingCreators > 0 ? `${stats.pendingCreators} pending` : 'all approved', href: '/admin/creators' },
          { label: 'Businesses', value: stats.totalBusinesses, href: '/admin/businesses' },
          { label: 'Total matches', value: stats.totalMatches, href: '/admin/collabs' },
          { label: 'Closed matches', value: stats.closedMatches, sub: stats.totalMatches > 0 ? `${Math.round((stats.closedMatches / stats.totalMatches) * 100)}% completion` : undefined, href: '/admin/collabs' },
          { label: 'Active collabs', value: stats.activeInvites, href: '/admin/collabs' },
          { label: 'Posts to verify', value: stats.postsToVerify, href: '/admin/collabs' },
          { label: 'Unused invite codes', value: stats.unusedCodes, href: '/admin/invite-codes' },
        ] as { label: string; value: number; sub?: string; href: string }[]).map(({ label, value, sub, href }) => (
          <Link key={label} href={href} className="block rounded-2xl bg-white p-5 hover:-translate-y-0.5 hover:shadow-md transition-all" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
            <p className="text-3xl font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>{value}</p>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{label}</p>
            {sub && <p className="text-xs text-[#F5B800] mt-1 font-semibold">{sub}</p>}
          </Link>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Recent matches</h2>
          <Link href="/admin/collabs" className="text-xs font-semibold text-gray-400 hover:text-[#1C2B3A] transition-colors">View all →</Link>
        </div>
        {!recentMatches.length ? (
          <p className="text-sm text-gray-400">No matches yet.</p>
        ) : (
          <div className="rounded-2xl overflow-hidden bg-white" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
            {recentMatches.map((match, i) => {
              const offer = (match.offer as unknown) as { title: string } | null
              const creator = (match.creator as unknown) as { display_name: string; instagram_handle: string | null } | null
              const business = (match.business as unknown) as { business_name: string | null } | null
              const deliverables = (match.deliverables as unknown) as { verified_at: string | null }[] | null
              const state = deriveMatchState({ closed_at: match.closed_at, deliverables: deliverables ?? [] })
              return (
                <Link
                  key={match.id}
                  href="/admin/collabs"
                  className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors"
                  style={{ borderBottom: i < recentMatches.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1C2B3A] truncate">{offer?.title}</p>
                    <p className="text-xs text-gray-400">
                      {creator?.instagram_handle ? `@${creator.instagram_handle}` : creator?.display_name}
                      {business?.business_name ? ` → ${business.business_name}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-mono text-gray-400">{match.punt_code}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${STATE_COLOUR[state]}20`, color: STATE_COLOUR[state] }}>
                      {STATE_LABEL[state]}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
