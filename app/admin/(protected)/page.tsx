import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

async function getStats(supabase: Awaited<ReturnType<typeof createClient>>) {
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
  return {
    totalCreators: totalCreators ?? 0,
    pendingCreators: pendingCreators ?? 0,
    totalBusinesses: totalBusinesses ?? 0,
    totalMatches: totalMatches ?? 0,
    activeInvites: activeInvites ?? 0,
    unusedCodes: unusedCodes ?? 0,
  }
}

async function getRecentMatches(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data } = await supabase
    .from('matches')
    .select('id, status, created_at, punt_code, offer:offers(title), creator:profiles!matches_creator_id_fkey(display_name,instagram_handle), business:profiles!matches_business_id_fkey(business_name)')
    .order('created_at', { ascending: false })
    .limit(10)
  return data ?? []
}

export default async function AdminOverview() {
  const supabase = await createClient()
  const [stats, recentMatches] = await Promise.all([getStats(supabase), getRecentMatches(supabase)])

  const statusColour: Record<string, string> = {
    pending: '#F5B800',
    visited: '#6BE6B0',
    posted: '#C084FC',
    verified: '#22c55e',
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Overview</h1>
        <p className="text-sm text-gray-500 mt-0.5">Platform health at a glance.</p>
      </div>

      {stats.pendingCreators > 0 && (
        <Link href="/admin/creators">
          <div className="flex items-center gap-3 rounded-2xl px-4 py-3 mb-6 cursor-pointer hover:opacity-90 transition-opacity" style={{ background: 'rgba(245,184,0,0.1)', border: '1.5px solid rgba(245,184,0,0.3)' }}>
            <span className="text-sm font-semibold text-[#1C2B3A]">
              {stats.pendingCreators} creator{stats.pendingCreators !== 1 ? 's' : ''} awaiting approval
            </span>
            <span className="text-xs font-semibold text-[#F5B800] ml-auto">Review →</span>
          </div>
        </Link>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        {[
          { label: 'Creators', value: stats.totalCreators, sub: stats.pendingCreators > 0 ? `${stats.pendingCreators} pending` : 'all approved', href: '/admin/creators' },
          { label: 'Businesses', value: stats.totalBusinesses, href: '/admin/businesses' },
          { label: 'Total matches', value: stats.totalMatches, href: '/admin/matches' },
          { label: 'Active invites', value: stats.activeInvites, href: '/admin/invites' },
          { label: 'Unused invite codes', value: stats.unusedCodes, href: '/admin/invite-codes' },
        ].map(({ label, value, sub, href }) => (
          <Link key={label} href={href} className="block rounded-2xl bg-white p-5 hover:-translate-y-0.5 hover:shadow-md transition-all" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
            <p className="text-3xl font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>{value}</p>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{label}</p>
            {sub && <p className="text-xs text-[#F5B800] mt-1 font-semibold">{sub}</p>}
          </Link>
        ))}
      </div>

      <div>
        <h2 className="font-semibold text-[#1C2B3A] mb-3" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Recent matches</h2>
        {!recentMatches.length ? (
          <p className="text-sm text-gray-400">No matches yet.</p>
        ) : (
          <div className="rounded-2xl overflow-hidden bg-white" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
            {recentMatches.map((match, i) => {
              const offer = (match.offer as unknown) as { title: string } | null
              const creator = (match.creator as unknown) as { display_name: string; instagram_handle: string | null } | null
              const business = (match.business as unknown) as { business_name: string | null } | null
              return (
                <div key={match.id} className="flex items-center gap-4 px-4 py-3" style={{ borderBottom: i < recentMatches.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1C2B3A] truncate">{offer?.title}</p>
                    <p className="text-xs text-gray-400">
                      {creator?.instagram_handle ? `@${creator.instagram_handle}` : creator?.display_name}
                      {business?.business_name ? ` → ${business.business_name}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-mono text-gray-400">{match.punt_code}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${statusColour[match.status]}20`, color: statusColour[match.status] }}>
                      {match.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
