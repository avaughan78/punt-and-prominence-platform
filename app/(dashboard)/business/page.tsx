import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
import { StatCard } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { BusinessDashboardAlerts } from '@/components/layout/BusinessDashboardAlerts'
import { formatDate, formatGBP } from '@/lib/utils'
import { deriveMatchState } from '@/lib/types'
import { Plus, AlertCircle } from 'lucide-react'

export default async function BusinessDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: offers }, { data: matches }, { data: allMatchData }] = await Promise.all([
    supabase.from('profiles').select('business_name').eq('id', user!.id).single(),
    supabase.from('offers').select('id, is_active').eq('business_id', user!.id),
    supabase.from('matches')
      .select('id, closed_at, created_at, punt_code, offer_id, offer:offers(title,value_gbp), creator:profiles!matches_creator_id_fkey(id,display_name,instagram_handle), deliverables:match_deliverables(verified_at)')
      .eq('business_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('matches').select('closed_at, scan_count').eq('business_id', user!.id),
  ])

  if (!profile?.business_name) redirect('/business/onboarding')

  const allMatches = allMatchData ?? []

  const activeOffers    = offers?.filter(o => o.is_active).length ?? 0
  const creatorsMatched = allMatches.length
  const inProgress      = allMatches.filter(m => !m.closed_at).length
  const fulfilled       = allMatches.filter(m => !!m.closed_at).length
  const visits          = allMatches.filter(m => (m.scan_count ?? 0) > 0).length

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back. Here&apos;s your activity.</p>
        </div>
        <Link href="/business/invites/new">
          <Button size="sm">
            <Plus className="w-4 h-4" />
            New collab
          </Button>
        </Link>
      </div>

      {/* Posts to verify + unread messages — client-side so counts stay fresh */}
      <BusinessDashboardAlerts />

      {/* Incomplete profile banner */}
      {!profile?.business_name && (
        <Link href="/business/onboarding">
          <div className="flex items-center gap-3 rounded-2xl px-4 py-3 mb-6 cursor-pointer hover:opacity-90 transition-opacity" style={{ background: 'rgba(245,184,0,0.1)', border: '1.5px solid rgba(245,184,0,0.3)' }}>
            <AlertCircle className="w-4 h-4 shrink-0" style={{ color: '#F5B800' }} />
            <p className="text-sm text-[#1C2B3A] flex-1" style={{ fontFamily: "'Inter', sans-serif" }}>
              <span className="font-semibold">Complete your business profile</span> — creators need to see who you are before they can match with you.
            </p>
            <span className="text-xs font-semibold text-[#F5B800] shrink-0">Set up →</span>
          </div>
        </Link>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        <StatCard label="Open collabs" value={activeOffers} href="/business/invites?filter=open" />
        <StatCard label="Creators matched" value={creatorsMatched} accent="#6BE6B0" href="/business/invites" />
        <StatCard label="In progress" value={inProgress} accent="#C084FC" href="/business/invites?filter=in_progress" />
        <StatCard label="Visits confirmed" value={visits} accent="#F5B800" href="/business/invites?filter=visited" />
        <StatCard label="Fulfilled" value={fulfilled} accent="#22c55e" href="/business/invites?filter=fulfilled" />
      </div>

      {/* Recent activity */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Recent activity</h2>
          <Link href="/business/invites" className="text-xs text-gray-400 hover:text-gray-600">View all →</Link>
        </div>

        {!matches?.length ? (
          <div className="rounded-2xl p-8 text-center" style={{ border: '1.5px dashed rgba(0,0,0,0.1)' }}>
            <p className="text-sm text-gray-400 mb-3">No matches yet.</p>
            {!activeOffers && (
              <Link href="/business/invites/new">
                <Button size="sm" variant="secondary">Post your first collab</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
            {matches.map((match, i) => {
              const offer = (match.offer as unknown) as { title: string; value_gbp: number } | null
              const creator = (match.creator as unknown) as { id: string; display_name: string; instagram_handle: string | null } | null
              const deliverables = (match.deliverables as unknown) as { verified_at: string | null }[] | null
              const offerId = (match as unknown as { offer_id: string }).offer_id
              const state = deriveMatchState({ closed_at: match.closed_at, deliverables: deliverables ?? [] })
              return (
                <div
                  key={match.id}
                  className="flex items-center gap-3 px-4 py-3 bg-white"
                  style={{ borderBottom: i < matches.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}
                >
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/business/invites?open=${offerId}`}
                      className="text-sm font-medium text-[#1C2B3A] truncate block hover:underline"
                    >
                      {offer?.title}
                    </Link>
                    <p className="text-xs text-gray-400">
                      {creator && (
                        <Link
                          href={`/business/creators/${creator.id}`}
                          className="hover:underline hover:text-[#1C2B3A] transition-colors"
                        >
                          {creator.instagram_handle ? `@${creator.instagram_handle}` : creator.display_name}
                        </Link>
                      )} · {formatDate(match.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="hidden sm:inline text-xs font-mono text-gray-400">{match.punt_code}</span>
                    {offer && <span className="text-xs font-semibold" style={{ color: '#F5B800' }}>{formatGBP(offer.value_gbp)}</span>}
                    <StatusBadge state={state} />
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
