'use client'
import { useState, useEffect } from 'react'
import { BusinessMatchCard } from '@/components/matches/BusinessMatchCard'
import type { Match, MatchStatus } from '@/lib/types'

const TABS: { label: string; value: MatchStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Posted', value: 'posted' },
  { label: 'Active', value: 'active' },
  { label: 'Verified', value: 'verified' },
]

export function BusinessMatchesClient({ currentUserId }: { currentUserId: string }) {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<MatchStatus | 'all'>('all')

  useEffect(() => {
    fetch('/api/matches')
      .then(r => r.json())
      .then(data => { setMatches(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function handleUpdated(updated: Match) {
    setMatches(prev => prev.map(m => m.id === updated.id ? { ...m, ...updated } : m))
  }

  const filtered = tab === 'all' ? matches : matches.filter(m => m.status === tab)

  const actionCount = matches.filter(m => {
    const isRetainer = m.invite?.invite_type === 'retainer'
    if (!isRetainer && m.status === 'posted') return true
    if (isRetainer && m.status === 'pending') return true
    if (isRetainer && m.status === 'active' && (m.deliverables ?? []).some(d => d.status !== 'verified')) return true
    return false
  }).length

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Matches</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {matches.length} total
            {actionCount > 0 && (
              <span className="ml-2 text-xs font-semibold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(245,184,0,0.15)', color: '#b45309' }}>
                {actionCount} need attention
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all"
            style={{
              background: tab === t.value ? '#1C2B3A' : 'transparent',
              color: tab === t.value ? 'white' : '#6b7280',
            }}
          >
            {t.label}
            {t.value !== 'all' && (
              <span className="ml-1.5 text-xs opacity-60">
                {matches.filter(m => m.status === t.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-[#F5B800] border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ border: '1.5px dashed rgba(0,0,0,0.1)' }}>
          <p className="text-sm text-gray-400">No {tab === 'all' ? '' : tab + ' '}matches yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {filtered.map(match => (
            <BusinessMatchCard key={match.id} match={match} currentUserId={currentUserId} onUpdated={handleUpdated} />
          ))}
        </div>
      )}
    </div>
  )
}
