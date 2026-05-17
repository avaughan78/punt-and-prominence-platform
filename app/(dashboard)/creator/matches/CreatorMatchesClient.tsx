'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CreatorMatchCard } from '@/components/matches/CreatorMatchCard'
import { Button } from '@/components/ui/Button'
import { deriveMatchState } from '@/lib/types'
import type { Match } from '@/lib/types'

type Filter = 'all' | 'in_progress' | 'visited' | 'todo' | 'submitted' | 'done' | 'one_off' | 'retainer' | 'unread'

function matchesFilter(m: Match, f: Filter, unreadMatchIds: Set<string>): boolean {
  const state = deriveMatchState(m)
  switch (f) {
    case 'unread':      return unreadMatchIds.has(m.id)
    case 'in_progress': return !m.closed_at
    case 'visited':     return (m.scan_count ?? 0) > 0
    case 'todo':        return state === 'in_progress'
    case 'submitted':   return state === 'needs_review'
    case 'done':        return state === 'closed'
    case 'one_off':     return m.invite?.invite_type !== 'retainer'
    case 'retainer':    return m.invite?.invite_type === 'retainer'
    default:            return true
  }
}

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all',         label: 'All' },
  { value: 'unread',      label: 'Unread' },
  { value: 'todo',        label: 'To do' },
  { value: 'submitted',   label: 'Submitted' },
  { value: 'in_progress', label: 'Active' },
  { value: 'visited',     label: 'Visited' },
  { value: 'done',        label: 'Done' },
  { value: 'one_off',     label: 'One-off' },
  { value: 'retainer',    label: 'Retainer' },
]

const EMPTY: Record<Filter, string> = {
  all:         'No collabs yet — browse what\'s available and claim one.',
  unread:      'All caught up — no unread messages.',
  in_progress: 'No active collabs right now.',
  visited:     'No visits recorded yet.',
  todo:        'You\'re all caught up — nothing needs action.',
  submitted:   'No posts pending verification.',
  done:        'No completed collabs yet.',
  one_off:     'No one-off collabs.',
  retainer:    'No retainer collabs.',
}

const STATE_ORDER: Record<string, number> = { needs_review: 0, in_progress: 1, up_to_date: 2, closed: 3 }

export function CreatorMatchesClient({ currentUserId, initialFilter }: { currentUserId: string; initialFilter?: Filter }) {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState<Filter>(initialFilter ?? 'all')
  const [frozenIds, setFrozenIds] = useState<Set<string> | null>(null)
  const [unreadMatchIds, setUnreadMatchIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    Promise.all([
      fetch('/api/matches').then(r => r.json()),
      fetch('/api/messages/unread').then(r => r.json()),
    ]).then(([matchData, unreadData]) => {
      setMatches(Array.isArray(matchData) ? matchData : [])
      setUnreadMatchIds(new Set(unreadData.unreadMatchIds ?? []))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    function refreshUnread() {
      fetch('/api/messages/unread')
        .then(r => r.json())
        .then(d => setUnreadMatchIds(new Set(d.unreadMatchIds ?? [])))
        .catch(() => {})
    }
    window.addEventListener('badges-refresh', refreshUnread)
    return () => window.removeEventListener('badges-refresh', refreshUnread)
  }, [])

  function handleUpdated(updated: Match) {
    setMatches(prev => prev.map(m => m.id === updated.id ? { ...m, ...updated } : m))
  }

  const sorted = [...matches].sort((a, b) =>
    (STATE_ORDER[deriveMatchState(a)] ?? 4) - (STATE_ORDER[deriveMatchState(b)] ?? 4)
  )

  function applyFilter(newFilter: Filter) {
    if (newFilter === 'all') {
      setFrozenIds(null)
    } else {
      setFrozenIds(new Set(sorted.filter(m => matchesFilter(m, newFilter, unreadMatchIds)).map(m => m.id)))
    }
    setFilter(newFilter)
  }

  // Frozen snapshot keeps items visible while you work through them; clears when filter changes
  const filtered = frozenIds
    ? sorted.filter(m => frozenIds.has(m.id))
    : sorted.filter(m => matchesFilter(m, filter, unreadMatchIds))

  const counts = Object.fromEntries(
    FILTERS.map(f => [f.value, f.value === 'all' ? matches.length : matches.filter(m => matchesFilter(m, f.value, unreadMatchIds)).length])
  ) as Record<Filter, number>

  const todoCount = counts.todo

  return (
    <div className="max-w-2xl mx-auto" style={{ overflow: 'hidden' }}>
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
            <div
              className="flex gap-1.5 mb-5 overflow-x-auto md:overflow-visible md:flex-wrap"
              style={{ scrollbarWidth: 'none' } as React.CSSProperties}
            >
              {FILTERS.filter(f => f.value === 'all' || counts[f.value] > 0).map(f => {
                const active   = filter === f.value
                const isUnread = f.value === 'unread'
                return (
                  <button
                    key={f.value}
                    onClick={() => applyFilter(f.value)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex-shrink-0"
                    style={{
                      background: active ? (isUnread ? '#F5B800' : '#1C2B3A') : isUnread ? 'rgba(245,184,0,0.1)' : 'rgba(28,43,58,0.06)',
                      color: active ? (isUnread ? '#1C2B3A' : 'white') : isUnread ? '#b45309' : '#6b7280',
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
                  onClick={() => applyFilter('all')}
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
