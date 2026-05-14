'use client'
import { useEffect, useState } from 'react'
import { formatGBP, formatDate } from '@/lib/utils'
import { ChevronDown, ExternalLink, Search } from 'lucide-react'

type Status = 'accepted' | 'posted' | 'verified' | 'active' | 'completed'

interface MatchEntry {
  id: string
  status: Status
  post_url: string | null
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
  description: string | null
  requirements: string | null
  invite_type: string | null
  value_gbp: number | null
  fee_gbp: number | null
  posts_per_month: number | null
  duration_months: number | null
  slots_total: number
  slots_claimed: number
  is_active: boolean
  created_at: string
  expires_at: string | null
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

const STATUS_COLOUR: Record<Status, { bg: string; text: string; label: string }> = {
  accepted:  { bg: 'rgba(245,184,0,0.12)',   text: '#b45309', label: 'Accepted' },
  posted:    { bg: 'rgba(192,132,252,0.15)', text: '#9333ea', label: 'Posted' },
  verified:  { bg: 'rgba(34,197,94,0.1)',    text: '#16a34a', label: 'Verified' },
  active:    { bg: 'rgba(107,230,176,0.12)', text: '#059669', label: 'Active' },
  completed: { bg: 'rgba(148,163,184,0.12)', text: '#64748b', label: 'Completed' },
}

const STATUS_DOT: Record<Status, string> = {
  accepted: '#F5B800', posted: '#C084FC', verified: '#22c55e', active: '#6BE6B0', completed: '#94a3b8',
}


const FILTERS = ['all', 'accepted', 'posted', 'verified', 'active', 'completed'] as const
type Filter = typeof FILTERS[number]

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

function collabPriority(g: CollabGroup): number {
  if (!g.is_active) return 2
  const hasLive = g.matches.some(m => m.status === 'posted' || m.status === 'accepted' || m.status === 'active')
  return hasLive ? 0 : 1
}

function StatusDots({ matches }: { matches: MatchEntry[] }) {
  const unique = [...new Set(matches.map(m => m.status))]
  return (
    <div className="flex gap-1 items-center">
      {unique.map(s => (
        <span key={s} className="rounded-full" style={{ width: '6px', height: '6px', background: STATUS_DOT[s] }} title={s} />
      ))}
    </div>
  )
}

function SlotBar({ total, claimed }: { total: number; claimed: number }) {
  const pct = total > 0 ? Math.round((claimed / total) * 100) : 0
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-gray-400 uppercase tracking-wide" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          Capacity
        </span>
        <span className="text-[10px] font-semibold" style={{ color: claimed >= total ? '#22c55e' : '#F5B800', fontFamily: "'JetBrains Mono', monospace" }}>
          {claimed}/{total}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)' }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: claimed >= total ? '#22c55e' : '#F5B800', transition: 'width 0.4s ease' }}
        />
      </div>
    </div>
  )
}

function CollabDetail({ group }: { group: CollabGroup }) {
  const isRetainer = group.invite_type === 'retainer'
  const value = isRetainer ? group.fee_gbp : group.value_gbp

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Value + type */}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md"
          style={{
            background: isRetainer ? 'rgba(107,230,176,0.15)' : 'rgba(245,184,0,0.12)',
            color: isRetainer ? '#059669' : '#b45309',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {isRetainer ? 'Retainer' : 'One-off'}
        </span>
        {!group.is_active && (
          <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-gray-100 text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Paused
          </span>
        )}
        {value != null && (
          <span className="text-sm font-bold ml-auto" style={{ color: isRetainer ? '#059669' : '#b45309', fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            {formatGBP(value)}{isRetainer ? '/mo' : ''}
          </span>
        )}
      </div>

      <SlotBar total={group.slots_total} claimed={group.slots_claimed} />

      {/* Description */}
      {group.description && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>About</p>
          <p className="text-xs text-gray-600 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>{group.description}</p>
        </div>
      )}

      {/* Requirements */}
      {group.requirements && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Requirements</p>
          <p className="text-xs text-gray-600 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>{group.requirements}</p>
        </div>
      )}

      {/* Retainer terms */}
      {isRetainer && (group.posts_per_month != null || group.duration_months != null) && (
        <div className="flex gap-4">
          {group.posts_per_month != null && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Posts/mo</p>
              <p className="text-xs font-bold text-[#1C2B3A]">{group.posts_per_month}</p>
            </div>
          )}
          {group.duration_months != null && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Duration</p>
              <p className="text-xs font-bold text-[#1C2B3A]">{group.duration_months}mo</p>
            </div>
          )}
        </div>
      )}

      {/* Dates */}
      <div className="mt-auto pt-2 flex flex-col gap-0.5" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        <p className="text-[10px] text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          Created {formatDate(group.created_at)}
        </p>
        {group.expires_at && (
          <p className="text-[10px] text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Expires {formatDate(group.expires_at)}
          </p>
        )}
      </div>
    </div>
  )
}

function CreatorRow({ match }: { match: MatchEntry }) {
  const meta = STATUS_COLOUR[match.status]
  const name = match.creator?.display_name ?? 'Unknown'
  const handle = match.creator?.instagram_handle
  const initial = name[0]?.toUpperCase() ?? '?'

  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl transition-colors hover:bg-gray-50" style={{ minWidth: 0 }}>
      {/* Avatar */}
      {match.creator?.avatar_url ? (
        <img src={match.creator.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
      ) : (
        <div
          className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #1C2B3A, #6BE6B0)' }}
        >
          {initial}
        </div>
      )}

      {/* Identity */}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-[#1C2B3A] truncate" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
          {handle ? (
            <a href={`https://instagram.com/${handle}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
              @{handle}
            </a>
          ) : name}
        </p>
        {match.creator?.follower_count != null && (
          <p className="text-[10px] text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {fmt(match.creator.follower_count)} followers
          </p>
        )}
      </div>

      {/* Status */}
      <span
        className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0"
        style={{ background: meta.bg, color: meta.text, fontFamily: "'JetBrains Mono', monospace" }}
      >
        {meta.label}
      </span>

      {/* Post link */}
      {match.post_url && (
        <a
          href={match.post_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] font-medium text-blue-400 hover:text-blue-600 transition-colors shrink-0"
        >
          <ExternalLink className="w-3 h-3" />
          Post
        </a>
      )}

      {/* Punt code */}
      <span className="text-[10px] text-gray-300 shrink-0 hidden lg:block" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {match.punt_code}
      </span>

    </div>
  )
}

export default function AdminCollabs() {
  const [groups, setGroups] = useState<CollabGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/admin/matches')
      .then(r => r.json())
      .then(d => { setGroups(Array.isArray(d) ? d : []); setLoading(false) })
  }, [])

  const totalCreators = groups.reduce((sum, g) => sum + g.matches.length, 0)

  const searchLower = search.toLowerCase()

  const filteredGroups = groups
    .map(g => ({
      ...g,
      matches: filter === 'all' ? g.matches : g.matches.filter(m => m.status === filter),
    }))
    .filter(g => {
      if (filter !== 'all' && g.matches.length === 0) return false
      if (!searchLower) return true
      const biz = g.business?.business_name ?? g.business?.display_name ?? ''
      return (
        g.title.toLowerCase().includes(searchLower) ||
        biz.toLowerCase().includes(searchLower)
      )
    })
    .sort((a, b) => collabPriority(a) - collabPriority(b))

  const counts = FILTERS.reduce((acc, f) => {
    acc[f] = f === 'all'
      ? totalCreators
      : groups.reduce((sum, g) => sum + g.matches.filter(m => m.status === f).length, 0)
    return acc
  }, {} as Record<Filter, number>)

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Collabs</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {groups.length} collab{groups.length !== 1 ? 's' : ''} · {totalCreators} creator{totalCreators !== 1 ? 's' : ''} matched
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="search"
            placeholder="Search collabs or businesses…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm rounded-xl border border-black/10 outline-none focus:border-[#F5B800] w-64 transition-colors"
            style={{ fontFamily: "'Inter', sans-serif" }}
          />
        </div>
      </div>

      {/* Status filter pills */}
      <div className="flex gap-1.5 flex-wrap mb-6">
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
            {f === 'all' ? 'All' : STATUS_COLOUR[f as Status].label}
            {counts[f] > 0 && (
              <span className="ml-1.5 opacity-60">({counts[f]})</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : !filteredGroups.length ? (
        <p className="text-sm text-gray-400">No collabs found.</p>
      ) : (
        <div className="rounded-2xl overflow-hidden bg-white" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
          {filteredGroups.map((group, gi) => {
            const isRetainer = group.invite_type === 'retainer'
            const bizName = group.business?.business_name ?? group.business?.display_name ?? '—'
            const isExpanded = expanded.has(group.id)
            const isLast = gi === filteredGroups.length - 1
            const hasAction = group.matches.some(m => m.status === 'posted')

            return (
              <div
                key={group.id}
                style={{ borderBottom: isLast && !isExpanded ? 'none' : '1px solid rgba(0,0,0,0.06)' }}
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
                      {!group.is_active && (
                        <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-gray-100 text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          paused
                        </span>
                      )}
                      {hasAction && (
                        <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded" style={{ background: 'rgba(192,132,252,0.15)', color: '#9333ea', fontFamily: "'JetBrains Mono', monospace" }}>
                          post ready
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {bizName}{group.business?.category ? ` · ${group.business.category}` : ''}
                    </p>
                  </div>

                  {/* Slot fraction */}
                  <span className="text-xs font-semibold hidden sm:block shrink-0" style={{ color: group.slots_claimed >= group.slots_total ? '#22c55e' : '#F5B800', fontFamily: "'JetBrains Mono', monospace" }}>
                    {group.slots_claimed}/{group.slots_total}
                  </span>

                  {/* Status dots */}
                  <StatusDots matches={group.matches} />

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

                {/* ── Expanded panel: 35/65 two-column ── */}
                {isExpanded && (
                  <div
                    className="flex gap-0"
                    style={{ background: '#f8f9fb', borderTop: '1px solid rgba(0,0,0,0.05)' }}
                  >
                    {/* Left: collab details */}
                    <div
                      className="p-5 flex-shrink-0"
                      style={{ width: '35%', borderRight: '1px solid rgba(0,0,0,0.06)' }}
                    >
                      <CollabDetail group={group} />
                    </div>

                    {/* Right: creator rows */}
                    <div className="flex-1 py-3 min-w-0">
                      {group.matches.length === 0 ? (
                        <p className="text-sm text-gray-400 px-4 py-2">No creators match this filter.</p>
                      ) : (
                        <div className="flex flex-col gap-0.5 px-2">
                          {[...group.matches]
                            .sort((a, b) => {
                              const order: Record<Status, number> = { posted: 0, accepted: 1, active: 2, verified: 3, completed: 4 }
                              return (order[a.status] ?? 5) - (order[b.status] ?? 5)
                            })
                            .map(match => (
                              <CreatorRow
                                key={match.id}
                                match={match}
                              />
                            ))}
                        </div>
                      )}
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
