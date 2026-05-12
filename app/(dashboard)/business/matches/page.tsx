'use client'
import { useState, useEffect } from 'react'
import { MatchCard } from '@/components/matches/MatchCard'
import type { Match, MatchStatus } from '@/lib/types'

const TABS: { label: string; value: MatchStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Visited', value: 'visited' },
  { label: 'Posted', value: 'posted' },
  { label: 'Verified', value: 'verified' },
]

export default function BusinessMatchesPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<MatchStatus | 'all'>('all')

  useEffect(() => {
    fetch('/api/matches')
      .then(r => r.json())
      .then(data => { setMatches(data); setLoading(false) })
  }, [])

  function handleUpdated(updated: Match) {
    setMatches(prev => prev.map(m => m.id === updated.id ? { ...m, ...updated } : m))
  }

  const filtered = tab === 'all' ? matches : matches.filter(m => m.status === tab)

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Matches</h1>
        <p className="text-sm text-gray-500 mt-0.5">Track creators who have claimed your offers.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all"
            style={{
              background: tab === t.value ? '#1C2B3A' : 'transparent',
              color: tab === t.value ? 'white' : '#6b7280',
              fontFamily: "'Inter', sans-serif",
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
        <div className="flex flex-col gap-4">
          {filtered.map(match => (
            <MatchCard key={match.id} match={match} role="business" onUpdated={handleUpdated} />
          ))}
        </div>
      )}
    </div>
  )
}
