'use client'
import { useEffect, useState } from 'react'
import { formatGBP, formatDate } from '@/lib/utils'

type Status = 'pending' | 'visited' | 'posted' | 'verified'

interface Match {
  id: string
  status: Status
  created_at: string
  punt_code: string
  offer: { title: string; value_gbp: number | null; fee_gbp: number | null; invite_type: string | null } | null
  creator: { display_name: string; instagram_handle: string | null } | null
  business: { business_name: string | null; display_name: string } | null
}

const STATUS_COLOUR: Record<Status, string> = {
  pending: '#F5B800',
  visited: '#6BE6B0',
  posted: '#C084FC',
  verified: '#22c55e',
}

const FILTERS = ['all', 'pending', 'visited', 'posted', 'verified'] as const
type Filter = typeof FILTERS[number]

export default function AdminMatches() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    fetch('/api/admin/matches')
      .then(r => r.json())
      .then(d => { setMatches(Array.isArray(d) ? d : []); setLoading(false) })
  }, [])

  const filtered = filter === 'all' ? matches : matches.filter(m => m.status === filter)

  const counts = FILTERS.reduce((acc, f) => {
    acc[f] = f === 'all' ? matches.length : matches.filter(m => m.status === f).length
    return acc
  }, {} as Record<Filter, number>)

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Matches</h1>
          <p className="text-sm text-gray-500 mt-0.5">{matches.length} total across all businesses</p>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors capitalize"
              style={{
                background: filter === f ? '#1C2B3A' : 'white',
                color: filter === f ? 'white' : '#6b7280',
                border: '1px solid rgba(0,0,0,0.1)',
              }}
            >
              {f} {counts[f] > 0 && <span className="opacity-60">({counts[f]})</span>}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : !filtered.length ? (
        <p className="text-sm text-gray-400">No matches found.</p>
      ) : (
        <div className="rounded-2xl overflow-hidden bg-white" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
          {filtered.map((match, i) => {
            const colour = STATUS_COLOUR[match.status]
            const isRetainer = match.offer?.invite_type === 'retainer'
            const value = isRetainer ? match.offer?.fee_gbp : match.offer?.value_gbp
            const valueLabel = isRetainer ? '/mo' : ''
            return (
              <div
                key={match.id}
                className="flex items-center gap-4 px-4 py-3"
                style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1C2B3A] truncate">{match.offer?.title ?? '—'}</p>
                  <p className="text-xs text-gray-400">
                    {match.creator?.instagram_handle ? `@${match.creator.instagram_handle}` : match.creator?.display_name}
                    {' → '}
                    {match.business?.business_name ?? match.business?.display_name ?? '—'}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-right">
                  {value != null && (
                    <span className="text-xs font-semibold" style={{ color: '#F5B800', fontFamily: "'JetBrains Mono', monospace" }}>
                      {formatGBP(value)}{valueLabel}
                    </span>
                  )}
                  <span className="text-xs font-mono text-gray-400">{match.punt_code}</span>
                  <span className="text-xs text-gray-400 hidden sm:block">{formatDate(match.created_at)}</span>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: `${colour}20`, color: colour }}
                  >
                    {match.status}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
