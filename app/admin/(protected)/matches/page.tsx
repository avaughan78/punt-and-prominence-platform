'use client'
import { useEffect, useState } from 'react'
import { formatGBP, formatDate } from '@/lib/utils'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'

type Status = 'pending' | 'visited' | 'posted' | 'verified'

interface Match {
  id: string
  status: Status
  created_at: string
  punt_code: string
  offer: {
    title: string
    value_gbp: number | null
    fee_gbp: number | null
    invite_type: string | null
    posts_per_month: number | null
    duration_months: number | null
  } | null
  creator: {
    id: string
    display_name: string
    instagram_handle: string | null
    follower_count: number | null
    avatar_url: string | null
  } | null
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
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [advancing, setAdvancing] = useState<string | null>(null)

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

  async function advanceStatus(match: Match) {
    const next = STATUS_NEXT[match.status]
    if (!next) return
    setAdvancing(match.id)
    const res = await fetch(`/api/admin/matches/${match.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    if (res.ok) {
      setMatches(ms => ms.map(m => m.id === match.id ? { ...m, status: next } : m))
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
            const nextStatus = STATUS_NEXT[match.status]
            const nextColour = nextStatus ? STATUS_COLOUR[nextStatus] : null
            const isRetainer = match.offer?.invite_type === 'retainer'
            const value = isRetainer ? match.offer?.fee_gbp : match.offer?.value_gbp
            const valueLabel = isRetainer ? '/mo' : ''
            const isExpanded = expanded === match.id
            const isLast = i === filtered.length - 1

            return (
              <div
                key={match.id}
                style={{ borderBottom: (!isLast || isExpanded) ? '1px solid rgba(0,0,0,0.06)' : 'none' }}
              >
                {/* Main row */}
                <div className="flex items-center gap-4 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1C2B3A] truncate">{match.offer?.title ?? '—'}</p>
                    <p className="text-xs text-gray-400">
                      {match.creator?.instagram_handle ? (
                        <a
                          href={`https://instagram.com/${match.creator.instagram_handle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-[#1C2B3A] transition-colors"
                        >
                          @{match.creator.instagram_handle}
                        </a>
                      ) : (
                        match.creator?.display_name
                      )}
                      {' → '}
                      {match.business?.business_name ?? match.business?.display_name ?? '—'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {value != null && (
                      <span className="text-xs font-semibold hidden sm:block" style={{ color: '#F5B800', fontFamily: "'JetBrains Mono', monospace" }}>
                        {formatGBP(value)}{valueLabel}
                      </span>
                    )}
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
                        onClick={() => advanceStatus(match)}
                        disabled={advancing === match.id}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full transition-all hover:opacity-80 disabled:opacity-40"
                        style={{ background: `${nextColour}20`, color: nextColour, border: `1px solid ${nextColour}40` }}
                        title={`Mark as ${nextStatus}`}
                      >
                        {advancing === match.id ? '…' : `→ ${nextStatus}`}
                      </button>
                    )}
                    <button
                      onClick={() => setExpanded(prev => prev === match.id ? null : match.id)}
                      className="p-1 rounded-lg text-gray-300 hover:text-gray-500 transition-colors"
                    >
                      {isExpanded
                        ? <ChevronUp className="w-3.5 h-3.5" />
                        : <ChevronDown className="w-3.5 h-3.5" />
                      }
                    </button>
                  </div>
                </div>

                {/* Expanded drawer */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1" style={{ background: 'rgba(0,0,0,0.015)' }}>
                    <div className="grid grid-cols-2 gap-3 mb-3">

                      {/* Creator */}
                      <div className="rounded-xl bg-white p-3" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Creator</p>
                        <div className="flex items-center gap-2">
                          {match.creator?.avatar_url ? (
                            <img src={match.creator.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-100 shrink-0 flex items-center justify-center text-xs font-bold text-gray-400">
                              {match.creator?.display_name?.[0]?.toUpperCase()}
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
                          <p className="text-xs text-gray-400 mt-2">{match.creator.follower_count.toLocaleString()} followers</p>
                        )}
                      </div>

                      {/* Business */}
                      <div className="rounded-xl bg-white p-3" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Business</p>
                        <div className="flex items-center gap-2">
                          {match.business?.avatar_url ? (
                            <img src={match.business.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-100 shrink-0 flex items-center justify-center text-xs font-bold text-gray-400">
                              {(match.business?.business_name ?? match.business?.display_name)?.[0]?.toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#1C2B3A] truncate">{match.business?.business_name ?? match.business?.display_name}</p>
                            <p className="text-xs text-gray-400 truncate">
                              {[match.business?.category, match.business?.address_line].filter(Boolean).join(' · ')}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-3 mt-2">
                          {match.business?.instagram_handle && (
                            <a
                              href={`https://instagram.com/${match.business.instagram_handle}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] font-semibold text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              Instagram ↗
                            </a>
                          )}
                          {match.business?.website_url && (
                            <a
                              href={match.business.website_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] font-semibold text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              Website ↗
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Collab strip */}
                    <div className="rounded-xl bg-white px-3 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Collab</span>
                      {match.offer?.invite_type && (
                        <span
                          className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
                          style={{
                            background: match.offer.invite_type === 'retainer' ? 'rgba(192,132,252,0.12)' : 'rgba(107,230,176,0.12)',
                            color: match.offer.invite_type === 'retainer' ? '#9333ea' : '#059669',
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          {match.offer.invite_type === 'retainer' ? 'retainer' : 'one-off'}
                        </span>
                      )}
                      {value != null && (
                        <span className="text-xs font-semibold" style={{ color: '#F5B800', fontFamily: "'JetBrains Mono', monospace" }}>
                          {formatGBP(value)}{valueLabel}
                        </span>
                      )}
                      {match.offer?.invite_type === 'retainer' && match.offer.posts_per_month != null && (
                        <span className="text-xs text-gray-400">{match.offer.posts_per_month} posts/mo</span>
                      )}
                      {match.offer?.invite_type === 'retainer' && match.offer.duration_months != null && (
                        <span className="text-xs text-gray-400">{match.offer.duration_months} months</span>
                      )}
                      <span className="text-xs font-mono text-gray-400">{match.punt_code}</span>
                      <span className="text-xs text-gray-400">{formatDate(match.created_at)}</span>
                    </div>
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
