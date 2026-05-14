'use client'
import { useEffect, useState } from 'react'
import { formatGBP, formatDate } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'
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

function SlotDots({ total, claimed }: { total: number; claimed: number }) {
  if (total > 8) {
    return (
      <span className="text-xs font-semibold tabular-nums" style={{ color: claimed >= total ? '#22c55e' : '#F5B800', fontFamily: "'JetBrains Mono', monospace" }}>
        {claimed}/{total}
      </span>
    )
  }
  return (
    <div className="flex gap-1 items-center">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className="rounded-full"
          style={{
            width: '7px', height: '7px',
            background: i < claimed ? (claimed >= total ? '#22c55e' : '#F5B800') : 'rgba(0,0,0,0.1)',
          }}
        />
      ))}
    </div>
  )
}

function StatusMini({ matches }: { matches: MatchEntry[] }) {
  const unique = [...new Set(matches.map(m => m.status))]
  return (
    <div className="flex gap-1 items-center">
      {unique.map(s => (
        <span
          key={s}
          className="rounded-full"
          style={{ width: '6px', height: '6px', background: STATUS_COLOUR[s] }}
          title={s}
        />
      ))}
    </div>
  )
}

function CreatorCard({ match, advancing, onAdvance }: { match: MatchEntry; advancing: string | null; onAdvance: (id: string, s: Status) => void }) {
  const colour = STATUS_COLOUR[match.status]
  const nextStatus = STATUS_NEXT[match.status]
  const nextColour = nextStatus ? STATUS_COLOUR[nextStatus] : null
  const initial = match.creator?.display_name?.[0]?.toUpperCase() ?? '?'

  function formatFollowers(n: number) {
    if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`
    return n.toString()
  }

  return (
    <div
      className="rounded-2xl bg-white flex flex-col overflow-hidden"
      style={{ width: '200px', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}
    >
      {/* Status strip */}
      <div style={{ height: '3px', background: colour }} />

      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Avatar + name */}
        <div className="flex items-center gap-3">
          {match.creator?.avatar_url ? (
            <img src={match.creator.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
          ) : (
            <div
              className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #1C2B3A, #6BE6B0)' }}
            >
              {initial}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#1C2B3A] truncate">{match.creator?.display_name}</p>
            {match.creator?.instagram_handle && (
              <a
                href={`https://instagram.com/${match.creator.instagram_handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-400 hover:text-[#1C2B3A] transition-colors"
              >
                @{match.creator.instagram_handle}
              </a>
            )}
          </div>
        </div>

        {match.creator?.follower_count != null && (
          <p className="text-xs text-gray-400 -mt-1">{formatFollowers(match.creator.follower_count)} followers</p>
        )}

        {/* Status + advance */}
        <div className="flex items-center gap-2 mt-auto flex-wrap">
          <span
            className="text-[11px] font-bold px-2.5 py-1 rounded-full"
            style={{ background: `${colour}18`, color: colour }}
          >
            {match.status}
          </span>
          {nextStatus && nextColour && (
            <button
              onClick={() => onAdvance(match.id, match.status)}
              disabled={advancing === match.id}
              className="text-[10px] font-bold px-2 py-0.5 rounded-full transition-all hover:opacity-75 disabled:opacity-40"
              style={{ background: `${nextColour}18`, color: nextColour, border: `1px solid ${nextColour}40` }}
            >
              {advancing === match.id ? '…' : `→ ${nextStatus}`}
            </button>
          )}
        </div>

        {/* Punt code + date */}
        <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
          <span className="text-[10px] font-bold tracking-widest text-gray-300" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{match.punt_code}</span>
          <span className="text-[10px] text-gray-300">{formatDate(match.created_at)}</span>
        </div>
      </div>
    </div>
  )
}

export default function AdminMatches() {
  const [groups, setGroups] = useState<CollabGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
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

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

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
        <div className="rounded-2xl overflow-hidden bg-white" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
          {filteredGroups.map((group, gi) => {
            const isRetainer = group.invite_type === 'retainer'
            const value = isRetainer ? group.fee_gbp : group.value_gbp
            const valueLabel = isRetainer ? '/mo' : ''
            const bizName = group.business?.business_name ?? group.business?.display_name ?? '—'
            const isExpanded = expanded.has(group.id)
            const isLast = gi === filteredGroups.length - 1
            const slotsOpen = group.slots_total - group.slots_claimed

            return (
              <div
                key={group.id}
                style={{ borderBottom: (!isLast || isExpanded) ? '1px solid rgba(0,0,0,0.06)' : 'none' }}
              >
                {/* ── Collab row ── */}
                <button
                  className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50/70"
                  onClick={() => toggleExpand(group.id)}
                >
                  {/* Business avatar */}
                  {group.business?.avatar_url ? (
                    <img src={group.business.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover shrink-0 ring-2 ring-white shadow-sm" />
                  ) : (
                    <div
                      className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-sm font-bold text-white ring-2 ring-white shadow-sm"
                      style={{ background: 'linear-gradient(135deg, #1C2B3A, #2d4a63)' }}
                    >
                      {bizName[0]?.toUpperCase()}
                    </div>
                  )}

                  {/* Title + business */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-[#1C2B3A]">{group.title}</span>
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
                        <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-gray-100 text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          closed
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {bizName}
                      {group.business?.category ? ` · ${group.business.category}` : ''}
                    </p>
                  </div>

                  {/* Value */}
                  {value != null && (
                    <span className="text-sm font-bold hidden sm:block shrink-0" style={{ color: '#F5B800', fontFamily: "'JetBrains Mono', monospace" }}>
                      {formatGBP(value)}{valueLabel}
                    </span>
                  )}

                  {/* Slot dots + status mini */}
                  <div className="flex flex-col items-center gap-1.5 shrink-0 hidden sm:flex">
                    <SlotDots total={group.slots_total} claimed={group.slots_claimed} />
                    {slotsOpen > 0 && group.is_active && (
                      <span className="text-[9px] text-gray-400 uppercase tracking-wide">{slotsOpen} open</span>
                    )}
                  </div>

                  {/* Status dots summary */}
                  <StatusMini matches={group.matches} />

                  {/* Date */}
                  <span className="text-xs text-gray-400 shrink-0 hidden md:block">{formatDate(group.created_at)}</span>

                  {/* Creator count */}
                  <span className="text-xs font-semibold text-gray-400 shrink-0">
                    {group.matches.length} creator{group.matches.length !== 1 ? 's' : ''}
                  </span>

                  {/* Chevron */}
                  <ChevronDown
                    className="w-4 h-4 shrink-0 transition-transform duration-200"
                    style={{ color: '#d1d5db', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  />
                </button>

                {/* ── Expanded creator cards ── */}
                {isExpanded && (
                  <div
                    className="px-5 py-4 flex flex-wrap gap-3"
                    style={{ background: '#f8f9fb', borderTop: '1px solid rgba(0,0,0,0.05)' }}
                  >
                    {group.matches.length === 0 ? (
                      <p className="text-sm text-gray-400">No creators match this filter.</p>
                    ) : (
                      group.matches.map(match => (
                        <CreatorCard
                          key={match.id}
                          match={match}
                          advancing={advancing}
                          onAdvance={advanceStatus}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
