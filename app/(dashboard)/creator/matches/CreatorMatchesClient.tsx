'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CreatorMatchCard } from '@/components/matches/CreatorMatchCard'
import { Button } from '@/components/ui/Button'
import type { Match } from '@/lib/types'

type Filter = 'all' | 'todo' | 'submitted' | 'done' | 'one_off' | 'retainer'

function isTodo(m: Match) {
  if (m.status === 'accepted') return true
  if (m.invite?.invite_type === 'retainer' && m.status === 'active') {
    return (m.deliverables ?? []).some(d => d.status !== 'verified')
  }
  return false
}

function matchesFilter(m: Match, f: Filter): boolean {
  switch (f) {
    case 'todo':     return isTodo(m)
    case 'submitted': return m.status === 'posted'
    case 'done':     return m.status === 'verified' || m.status === 'completed'
    case 'one_off':  return m.invite?.invite_type !== 'retainer'
    case 'retainer': return m.invite?.invite_type === 'retainer'
    default:         return true
  }
}

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all',       label: 'All' },
  { value: 'todo',      label: 'To do' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'done',      label: 'Done' },
  { value: 'one_off',   label: 'One-off' },
  { value: 'retainer',  label: 'Retainer' },
]

const EMPTY: Record<Filter, string> = {
  all:       'No matches yet.',
  todo:      'Nothing to action right now.',
  submitted: 'No posts awaiting verification.',
  done:      'No completed matches yet.',
  one_off:   'No one-off matches.',
  retainer:  'No retainer matches.',
}

export function CreatorMatchesClient({ currentUserId }: { currentUserId: string }) {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState<Filter>('all')

  useEffect(() => {
    fetch('/api/matches')
      .then(r => r.json())
      .then(data => { setMatches(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function handleUpdated(updated: Match) {
    setMatches(prev => prev.map(m => m.id === updated.id ? { ...m, ...updated } : m))
  }

  // Sort: to-do first, done last
  const sorted = [...matches].sort((a, b) => {
    const rank = (m: Match) => isTodo(m) ? 0 : (m.status === 'posted' ? 1 : 2)
    return rank(a) - rank(b)
  })

  const filtered = sorted.filter(m => matchesFilter(m, filter))

  const counts = Object.fromEntries(
    FILTERS.map(f => [f.value, f.value === 'all' ? matches.length : matches.filter(m => matchesFilter(m, f.value)).length])
  ) as Record<Filter, number>

  const todoCount = counts.todo

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
          My Collabs
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {matches.length} match{matches.length !== 1 ? 'es' : ''}
          {todoCount > 0 && (
            <span className="ml-2 text-xs font-semibold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(245,184,0,0.15)', color: '#b45309' }}>
              {todoCount} to do
            </span>
          )}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-[#F5B800] border-t-transparent animate-spin" />
        </div>
      ) : (
        <>
          {matches.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mb-5">
              {FILTERS.filter(f => f.value === 'all' || counts[f.value] > 0).map(f => {
                const active = filter === f.value
                return (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                    style={{
                      background: active ? '#1C2B3A' : 'rgba(28,43,58,0.06)',
                      color: active ? 'white' : '#6b7280',
                    }}
                  >
                    {f.label}
                    {f.value !== 'all' && (
                      <span
                        className="text-[10px] font-bold px-1 py-0.5 rounded-md min-w-[18px] text-center"
                        style={{ background: active ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)' }}
                      >
                        {counts[f.value]}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="rounded-2xl p-12 text-center" style={{ border: '1.5px dashed rgba(0,0,0,0.1)' }}>
              <p className="text-sm text-gray-400 mb-4">{EMPTY[filter]}</p>
              {filter === 'all' ? (
                <Link href="/creator/browse">
                  <Button variant="secondary">Browse available collabs</Button>
                </Link>
              ) : (
                <button
                  onClick={() => setFilter('all')}
                  className="text-xs text-gray-400 hover:text-[#1C2B3A] underline transition-colors"
                >
                  Show all matches
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filtered.map(match => (
                <CreatorMatchCard
                  key={match.id}
                  match={match}
                  currentUserId={currentUserId}
                  onUpdated={handleUpdated}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
