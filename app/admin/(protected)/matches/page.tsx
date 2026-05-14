'use client'
import { useEffect, useState } from 'react'
import { formatGBP, formatDate } from '@/lib/utils'
import { toast } from 'sonner'

type Status = 'pending' | 'visited' | 'posted' | 'verified'

interface MatchEntry {
  id: string
  status: Status
  created_at: string
  punt_code: string
  creator: {
    id: string
    display_name: string
    instagram_handle: string | null
    follower_count: number | null
    avatar_url: string | null
  } | null
}

interface CollabGroup {
  id: string
  title: string
  invite_type: string | null
  value_gbp: number | null
  fee_gbp: number | null
  posts_per_month: number | null
  duration_months: number | null
  slots_total: number
  slots_claimed: number
  is_active: boolean
  created_at: string
  business: {
    id: string
    business_name: string | null
    display_name: string
    category: string | null
    address_line: string | null
    instagram_handle: string | null
    website_url: string | null
    avatar_url: string | null
  } | null
  matches: MatchEntry[]
}

const STATUS_COLOUR: Record<Status, string> = {
  pending: '#F5B800',
  visited: '#6BE6B0',
  posted: '#C084FC',
  verified: '#22c55e',
}

const STATUS_NEXT: Partial<Record<Status, Status>> = {
  pending: 'visited',
  visited: 'posted',
  posted: 'verified',
}

const FILTERS = ['all', 'pending', 'visited', 'posted', 'verified'] as const
type Filter = typeof FILTERS[number]

export default function AdminMatches() {
  const [groups, setGroups] = useState<CollabGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [advancing, setAdvancing] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/matches')
      .then(r => r.json())
      .then(d => { setGroups(Array.isArray(d) ? d : []); setLoading(false) })
  }, [])

  const totalMatches = groups.reduce((sum, g) => sum + g.matches.length, 0)

  const filteredGroups = groups
    .map(g => ({
      ...g,
      matches: filter === 'all' ? g.matches : g.matches.filter(m => m.status === filter),
    }))
    .filter(g => g.matches.length > 0)

  const counts = FILTERS.reduce((acc, f) => {
    acc[f] = f === 'all' ? totalMatches : groups.reduce((sum, g) => sum + g.matches.filter(m => m.status === f).length, 0)
    return acc
  }, {} as Record<Filter, number>)

  async function advanceStatus(matchId: string, current: Status) {
    const next = STATUS_NEXT[current]
    if (!next) return
    setAdvancing(matchId)
    const res = await fetch(`/api/admin/matches/${matchId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    if (res.ok) {
      setGroups(gs => gs.map(g => ({
        ...g,
        matches: g.matches.map(m => m.id === matchId ? { ...m, status: next } : m),
      })))
      toast.success(`Marked as ${next}`)
    } else {
      toast.error('Failed to update status')
    }
    setAdvancing(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Matches</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {totalMatches} match{totalMatches !== 1 ? 'es' : ''} across {groups.length} collab{groups.length !== 1 ? 's' : ''}
          </p>
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
      ) : !filteredGroups.length ? (
        <p className="text-sm text-gray-400">No matches found.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredGroups.map(group => {
            const isRetainer = group.invite_type === 'retainer'
            const value = isRetainer ? group.fee_gbp : group.value_gbp
            const valueLabel = isRetainer ? '/mo' : ''
            const bizName = group.business?.business_name ?? group.business?.display_name ?? '—'
            const slotsOpen = group.slots_total - group.slots_claimed

            return (
              <div
                key={group.id}
                className="rounded-2xl bg-white overflow-hidden"
                style={{ border: '1px solid rgba(0,0,0,0.07)' }}
              >
                {/* Collab header */}
                <div
                  className="px-4 py-3 flex items-center gap-3"
                  style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', background: 'rgba(0,0,0,0.018)' }}
                >
                  {group.business?.avatar_url ? (
                    <img src={group.business.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-100 shrink-0 flex items-center justify-center text-xs font-bold text-gray-400">
                      {bizName[0]?.toUpperCase()}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-[#1C2B3A]">{group.title}</p>
                      {group.invite_type && (
                        <span
                          className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
                          style={{
                            background: isRetainer ? 'rgba(192,132,252,0.12)' : 'rgba(107,230,176,0.12)',
                            color: isRetainer ? '#9333ea' : '#059669',
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          {isRetainer ? 'retainer' : 'one-off'}
                        </span>
                      )}
                      {!group.is_active && (
                        <span
                          className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-gray-100 text-gray-400"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          closed
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      {bizName}
                      {value != null ? ` · ${formatGBP(value)}${valueLabel}` : ''}
                      {` · `}
                      <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {group.slots_claimed}/{group.slots_total} slots
                      </span>
                      {slotsOpen > 0 && group.is_active && (
                        <span className="text-[#F5B800]"> · {slotsOpen} open</span>
                      )}
                    </p>
                  </div>

                  <span className="text-xs text-gray-400 hidden sm:block shrink-0">{formatDate(group.created_at)}</span>
                </div>

                {/* Creator rows */}
                {group.matches.map((match, mi) => {
                  const colour = STATUS_COLOUR[match.status]
                  const nextStatus = STATUS_NEXT[match.status]
                  const nextColour = nextStatus ? STATUS_COLOUR[nextStatus] : null

                  return (
                    <div
                      key={match.id}
                      className="flex items-center gap-3 px-4 py-2.5"
                      style={{ borderBottom: mi < group.matches.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}
                    >
                      {/* Avatar */}
                      {match.creator?.avatar_url ? (
                        <img src={match.creator.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-gray-100 shrink-0 flex items-center justify-center text-xs font-bold text-gray-400">
                          {match.creator?.display_name?.[0]?.toUpperCase()}
                        </div>
                      )}

                      {/* Creator info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1C2B3A] truncate">{match.creator?.display_name}</p>
                        {match.creator?.instagram_handle && (
                          <a
                            href={`https://instagram.com/${match.creator.instagram_handle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-gray-400 hover:text-[#1C2B3A] transition-colors"
                          >
                            @{match.creator.instagram_handle}
                            {match.creator.follower_count != null
                              ? ` · ${match.creator.follower_count.toLocaleString()} followers`
                              : ''}
                          </a>
                        )}
                      </div>

                      {/* Status + actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-mono text-gray-400 hidden sm:block">{match.punt_code}</span>
                        <span className="text-xs text-gray-400 hidden md:block">{formatDate(match.created_at)}</span>
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: `${colour}20`, color: colour }}
                        >
                          {match.status}
                        </span>
                        {nextStatus && nextColour && (
                          <button
                            onClick={() => advanceStatus(match.id, match.status)}
                            disabled={advancing === match.id}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full transition-all hover:opacity-80 disabled:opacity-40"
                            style={{ background: `${nextColour}20`, color: nextColour, border: `1px solid ${nextColour}40` }}
                            title={`Mark as ${nextStatus}`}
                          >
                            {advancing === match.id ? '…' : `→ ${nextStatus}`}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
