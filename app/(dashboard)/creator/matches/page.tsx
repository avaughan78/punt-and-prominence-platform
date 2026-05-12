'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MatchCard } from '@/components/matches/MatchCard'
import { Button } from '@/components/ui/Button'
import type { Match, MatchStatus } from '@/lib/types'

const TABS: { label: string; value: MatchStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'In progress', value: 'visited' },
  { label: 'Verified', value: 'verified' },
]

export default function CreatorMatchesPage() {
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

  const filtered = tab === 'all' ? matches : matches.filter(m => {
    if (tab === 'visited') return ['pending','visited','posted'].includes(m.status)
    return m.status === tab
  })

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>My Matches</h1>
        <p className="text-sm text-gray-500 mt-0.5">Track your claimed offers and post submissions.</p>
      </div>

      <div className="flex gap-1 mb-6">
        {TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{
              background: tab === t.value ? '#1C2B3A' : 'transparent',
              color: tab === t.value ? 'white' : '#6b7280',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-[#F5B800] border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ border: '1.5px dashed rgba(0,0,0,0.1)' }}>
          <p className="text-sm text-gray-400 mb-4">No matches yet.</p>
          <Link href="/creator/browse">
            <Button variant="secondary">Browse available invites</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map(match => (
            <MatchCard key={match.id} match={match} role="creator" onUpdated={handleUpdated} />
          ))}
        </div>
      )}
    </div>
  )
}
