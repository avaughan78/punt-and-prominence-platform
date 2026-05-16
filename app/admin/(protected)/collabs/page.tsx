'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatGBP, formatDate } from '@/lib/utils'
import { ChevronDown, ExternalLink, Search, AlertCircle, X } from 'lucide-react'

type MatchStatus = 'accepted' | 'posted' | 'verified' | 'active' | 'completed'
type CollabFilter = 'all' | 'attention' | 'open' | 'closed'
type StatusFilter = 'any' | MatchStatus

interface Deliverable {
  id: string
  status: 'pending' | 'verified'
  post_url: string | null
  verified_at: string | null
  month_number: number | null
  created_at: string
}

interface MatchEntry {
  id: string
  status: MatchStatus
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
  deliverables: Deliverable[]
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
    instagram_handle: string | null
    avatar_url: string | null
  } | null
  matches: MatchEntry[]
}

const STATUS_META: Record<MatchStatus, { bg: string; text: string; label: string }> = {
  accepted:  { bg: 'rgba(245,184,0,0.12)',   text: '#b45309', label: 'Awaiting content' },
  posted:    { bg: 'rgba(192,132,252,0.15)', text: '#9333ea', label: 'Posted' },
  verified:  { bg: 'rgba(34,197,94,0.1)',    text: '#16a34a', label: 'Accepted' },
  active:    { bg: 'rgba(107,230,176,0.12)', text: '#059669', label: 'Active' },
  completed: { bg: 'rgba(148,163,184,0.12)', text: '#64748b', label: 'Completed' },
}

const MATCH_ORDER: Record<MatchStatus, number> = { posted: 0, accepted: 1, active: 2, verified: 3, completed: 4 }

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

function fmtDate(dt: string) {
  return new Date(dt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// ── Stats bar ──────────────────────────────────────────────────────────────────

interface StatsBarProps {
  groups: CollabGroup[]
  collabFilter: CollabFilter
  statusFilter: StatusFilter
  onFilter: (cf: CollabFilter, sf: StatusFilter) => void
}

function StatsBar({ groups, collabFilter, statusFilter, onFilter }: StatsBarProps) {
  const activeCollabs   = groups.filter(g => g.is_active).length
  const postsToVerify   = groups.reduce((s, g) => s + g.matches.filter(m => m.status === 'posted').length, 0)
  const activeRetainers = groups.reduce((s, g) => s + g.matches.filter(m => m.status === 'active').length, 0)
  const gmv = groups
    .filter(g => g.is_active)
    .reduce((s, g) => s + (g.invite_type === 'retainer' ? (g.fee_gbp ?? 0) : (g.value_gbp ?? 0)) * g.slots_claimed, 0)

  const stats: {
    label: string
    value: string | number
    accent: string
    onClick: (() => void) | null
    isActive: boolean
  }[] = [
    {
      label: 'Active collabs', value: activeCollabs, accent: '#F5B800',
      onClick: () => onFilter('open', 'any'),
      isActive: collabFilter === 'open' && statusFilter === 'any',
    },
    {
      label: 'Value in market', value: formatGBP(gmv), accent: '#6BE6B0',
      onClick: null,
      isActive: false,
    },
    {
      label: 'Posts to verify', value: postsToVerify, accent: postsToVerify > 0 ? '#C084FC' : '#94a3b8',
      onClick: () => onFilter('attention', 'any'),
      isActive: collabFilter === 'attention',
    },
    {
      label: 'Live retainers', value: activeRetainers, accent: '#60a5fa',
      onClick: () => onFilter('all', 'active'),
      isActive: statusFilter === 'active' && collabFilter !== 'attention',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {stats.map(s => (
        <button
          key={s.label}
          onClick={s.onClick ?? undefined}
          disabled={!s.onClick}
          className="rounded-xl bg-white px-4 py-3 text-left transition-all"
          style={{
            border: s.isActive ? `1.5px solid ${s.accent}` : '1px solid rgba(0,0,0,0.07)',
            boxShadow: s.isActive ? `0 0 0 3px ${s.accent}22` : 'none',
            cursor: s.onClick ? 'pointer' : 'default',
          }}
        >
          <p className="text-2xl font-extrabold leading-none" style={{ color: s.accent, fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            {s.value}
          </p>
          <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wide" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {s.label}{s.onClick && !s.isActive ? ' →' : ''}
          </p>
        </button>
      ))}
    </div>
  )
}

// ── Match status summary text ──────────────────────────────────────────────────

function MatchSummary({ matches }: { matches: MatchEntry[] }) {
  const counts = matches.reduce((acc, m) => {
    acc[m.status] = (acc[m.status] ?? 0) + 1
    return acc
  }, {} as Record<MatchStatus, number>)

  const parts = (Object.entries(counts) as [MatchStatus, number][])
    .sort(([a], [b]) => MATCH_ORDER[a] - MATCH_ORDER[b])
    .map(([status, count]) => (
      <span key={status} style={{ color: STATUS_META[status].text }}>
        {count} {STATUS_META[status].label.toLowerCase()}
      </span>
    ))

  return (
    <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      {parts}
    </div>
  )
}

// ── Creator row ────────────────────────────────────────────────────────────────

function CreatorRow({ match, isRetainer }: { match: MatchEntry; isRetainer: boolean }) {
  const [open, setOpen] = useState(false)
  const meta    = STATUS_META[match.status]
  const name    = match.creator?.display_name ?? 'Unknown'
  const handle  = match.creator?.instagram_handle
  const initial = name[0]?.toUpperCase() ?? '?'

  const deliverables  = match.deliverables ?? []
  const legacyUrl     = match.post_url && deliverables.length === 0 ? match.post_url : null
  // Legacy posts are shown as pending (not auto-verified) since we can't confirm status
  const legacyEntry   = legacyUrl
    ? [{ id: 'legacy', status: 'pending' as const, post_url: legacyUrl, verified_at: null, month_number: null, created_at: match.created_at }]
    : []
  const allPosts      = [...deliverables, ...legacyEntry]
  const verifiedCount = deliverables.filter(d => d.status === 'verified').length
  const hasPosts      = allPosts.length > 0

  return (
    <div>
      <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl transition-colors hover:bg-gray-50">
        {/* Avatar */}
        {match.creator?.avatar_url ? (
          <img src={match.creator.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #1C2B3A, #6BE6B0)' }}>
            {initial}
          </div>
        )}

        {/* Identity */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link
              href="/admin/creators"
              className="text-xs font-semibold text-[#1C2B3A] hover:underline truncate"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              {handle ? `@${handle}` : name}
            </Link>
            {handle && (
              <a href={`https://instagram.com/${handle}`} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-gray-500">
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
          {match.creator?.follower_count != null && (
            <p className="text-[10px] text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {fmt(match.creator.follower_count)} followers
            </p>
          )}
        </div>

        {/* Status */}
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0" style={{ background: meta.bg, color: meta.text, fontFamily: "'JetBrains Mono', monospace" }}>
          {meta.label}
        </span>

        {/* Deliverable count */}
        {deliverables.length > 0 && (
          <span className="text-[10px] font-semibold shrink-0" style={{ color: verifiedCount === deliverables.length ? '#16a34a' : '#9333ea', fontFamily: "'JetBrains Mono', monospace" }}>
            {verifiedCount}/{deliverables.length}
          </span>
        )}

        {/* Posts toggle */}
        {hasPosts && (
          <button
            onClick={() => setOpen(o => !o)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold shrink-0 transition-all"
            style={{ background: open ? 'rgba(192,132,252,0.2)' : 'rgba(192,132,252,0.1)', color: '#9333ea' }}
          >
            Posts <ChevronDown className="w-3 h-3 transition-transform duration-150" style={{ transform: open ? 'rotate(180deg)' : 'none' }} />
          </button>
        )}

        {/* Punt code */}
        <span className="text-[10px] text-gray-300 shrink-0 hidden lg:block" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {match.punt_code}
        </span>
      </div>

      {/* Deliverables panel */}
      {open && hasPosts && (
        <div className="mx-3 mb-2 rounded-xl px-3 py-2 flex flex-col gap-2" style={{ background: 'rgba(192,132,252,0.05)', border: '1px solid rgba(192,132,252,0.12)' }}>
          {allPosts.map((d, idx) => (
            <div key={d.id} className="flex items-center gap-2.5">
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                style={{ background: d.status === 'verified' ? '#6BE6B0' : '#e5e7eb', color: '#1C2B3A' }}
              >
                {d.month_number ?? idx + 1}
              </div>
              {d.post_url ? (
                <a href={d.post_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-500 hover:underline flex-1 truncate">
                  <ExternalLink className="w-3 h-3 shrink-0" />
                  {isRetainer ? `Month ${d.month_number ?? idx + 1}` : `Post ${idx + 1}`}
                </a>
              ) : (
                <span className="text-xs text-gray-400 flex-1">No URL submitted</span>
              )}
              <span className="text-[10px] text-gray-400 shrink-0" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {d.verified_at ? `✓ ${fmtDate(d.verified_at)}` : fmtDate(d.created_at)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Slot bar ───────────────────────────────────────────────────────────────────

function SlotBar({ total, claimed, inline }: { total: number; claimed: number; inline?: boolean }) {
  const pct   = total > 0 ? Math.round((claimed / total) * 100) : 0
  const full  = claimed >= total
  const color = full ? '#22c55e' : '#F5B800'

  if (inline) {
    return (
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs font-semibold" style={{ color, fontFamily: "'JetBrains Mono', monospace" }}>
          {claimed}/{total}
        </span>
        <div className="w-16 h-1.5 rounded-full overflow-hidden hidden sm:block" style={{ background: 'rgba(0,0,0,0.08)' }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-gray-400 uppercase tracking-wide" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Capacity</span>
        <span className="text-[10px] font-semibold" style={{ color, fontFamily: "'JetBrains Mono', monospace" }}>{claimed}/{total}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

// ── Collab detail (expanded left panel) ───────────────────────────────────────

function CollabDetail({ group }: { group: CollabGroup }) {
  const isRetainer = group.invite_type === 'retainer'
  const value      = isRetainer ? group.fee_gbp : group.value_gbp
  const bizName    = group.business?.business_name ?? group.business?.display_name ?? '—'

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md" style={{ background: isRetainer ? 'rgba(96,165,250,0.15)' : 'rgba(245,184,0,0.12)', color: isRetainer ? '#1d4ed8' : '#b45309', fontFamily: "'JetBrains Mono', monospace" }}>
          {isRetainer ? 'Retainer' : 'One-off'}
        </span>
        {!group.is_active && (
          <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-gray-100 text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Closed
          </span>
        )}
        {value != null && (
          <span className="text-sm font-bold ml-auto" style={{ color: isRetainer ? '#1d4ed8' : '#b45309', fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            {formatGBP(value)}{isRetainer ? '/mo' : ''}
          </span>
        )}
      </div>

      <SlotBar total={group.slots_total} claimed={group.slots_claimed} />

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Business</p>
        <Link href="/admin/businesses" className="text-xs font-semibold text-[#1C2B3A] hover:underline" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
          {bizName}
        </Link>
        {group.business?.category && (
          <p className="text-[10px] text-gray-400 mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{group.business.category}</p>
        )}
      </div>

      {group.description && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>About</p>
          <p className="text-xs text-gray-600 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>{group.description}</p>
        </div>
      )}

      {group.requirements && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Requirements</p>
          <p className="text-xs text-gray-600 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>{group.requirements}</p>
        </div>
      )}

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

      <div className="mt-auto pt-2 flex flex-col gap-0.5" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        <p className="text-[10px] text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Created {formatDate(group.created_at)}</p>
        {group.expires_at && (
          <p className="text-[10px] text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Expires {formatDate(group.expires_at)}</p>
        )}
      </div>
    </div>
  )
}

// ── Filter config ──────────────────────────────────────────────────────────────

const COLLAB_FILTERS: { value: CollabFilter; label: string }[] = [
  { value: 'all',       label: 'All' },
  { value: 'attention', label: 'Attention needed' },
  { value: 'open',      label: 'Open' },
  { value: 'closed',    label: 'Closed' },
]

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'any',       label: 'Any status' },
  { value: 'posted',    label: 'Posted' },
  { value: 'accepted',  label: 'Awaiting content' },
  { value: 'active',    label: 'Active' },
  { value: 'verified',  label: 'Accepted' },
  { value: 'completed', label: 'Completed' },
]

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminCollabs() {
  const [groups, setGroups]           = useState<CollabGroup[]>([])
  const [loading, setLoading]         = useState(true)
  const [collabFilter, setCollabFilter] = useState<CollabFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('any')
  const [search, setSearch]           = useState('')
  const [expanded, setExpanded]       = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/admin/matches')
      .then(r => r.json())
      .then(d => { setGroups(Array.isArray(d) ? d : []); setLoading(false) })
  }, [])

  // Collapse all cards when filters change so stale expanded state doesn't persist
  useEffect(() => { setExpanded(new Set()) }, [collabFilter, statusFilter, search])

  const attentionCount = groups.reduce((s, g) => s + g.matches.filter(m => m.status === 'posted').length, 0)
  const filtersActive  = collabFilter !== 'all' || statusFilter !== 'any' || search !== ''

  function applyFilter(cf: CollabFilter, sf: StatusFilter) {
    setCollabFilter(cf)
    setStatusFilter(sf)
  }

  function clearFilters() {
    setCollabFilter('all')
    setStatusFilter('any')
    setSearch('')
  }

  const searchLower = search.toLowerCase()

  const filteredGroups = groups
    // Collab-level filter runs first, against original matches (before status filter)
    .filter(g => {
      if (collabFilter === 'open'      && !g.is_active) return false
      if (collabFilter === 'closed'    && g.is_active)  return false
      // Attention: check original matches so status sub-filter doesn't interfere
      if (collabFilter === 'attention' && !g.matches.some(m => m.status === 'posted')) return false
      if (searchLower) {
        const bizName = g.business?.business_name ?? g.business?.display_name ?? ''
        const matchesCreator = g.matches.some(m =>
          (m.creator?.display_name ?? '').toLowerCase().includes(searchLower) ||
          (m.creator?.instagram_handle ?? '').toLowerCase().includes(searchLower)
        )
        if (
          !g.title.toLowerCase().includes(searchLower) &&
          !bizName.toLowerCase().includes(searchLower) &&
          !matchesCreator
        ) return false
      }
      return true
    })
    // Then apply status sub-filter to the match list within each collab
    .map(g => ({
      ...g,
      matches: statusFilter === 'any' ? g.matches : g.matches.filter(m => m.status === statusFilter),
      originalMatchCount: g.matches.length,
    }))
    // Hide collab entirely only when status filter left zero matches AND it had matches to begin with
    .filter(g => !(statusFilter !== 'any' && g.originalMatchCount > 0 && g.matches.length === 0))
    .sort((a, b) => {
      const pri = (g: CollabGroup) => {
        if (g.matches.some(m => m.status === 'posted')) return 0
        if (g.is_active && g.matches.some(m => m.status === 'accepted' || m.status === 'active')) return 1
        if (g.is_active) return 2
        return 3
      }
      return pri(a) - pri(b)
    })

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
            {groups.length} collab{groups.length !== 1 ? 's' : ''} · {groups.reduce((s, g) => s + g.matches.length, 0)} matches
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="search"
            placeholder="Search collab, business or creator…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm rounded-xl border border-black/10 outline-none focus:border-[#F5B800] w-full sm:w-72 transition-colors"
            style={{ fontFamily: "'Inter', sans-serif" }}
          />
        </div>
      </div>

      {!loading && <StatsBar groups={groups} collabFilter={collabFilter} statusFilter={statusFilter} onFilter={applyFilter} />}

      {/* Collab filter tabs */}
      <div className="flex items-center gap-1.5 flex-wrap mb-3">
        {COLLAB_FILTERS.map(f => {
          const active = collabFilter === f.value
          const badge  = f.value === 'attention' ? attentionCount : null
          return (
            <button
              key={f.value}
              onClick={() => applyFilter(f.value, statusFilter === 'any' ? 'any' : f.value === 'attention' ? 'any' : statusFilter)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors"
              style={{ background: active ? '#1C2B3A' : 'white', color: active ? 'white' : '#6b7280', border: '1px solid rgba(0,0,0,0.1)' }}
            >
              {f.value === 'attention' && <AlertCircle className="w-3 h-3" />}
              {f.label}
              {badge != null && badge > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: active ? 'rgba(255,255,255,0.2)' : 'rgba(192,132,252,0.2)', color: active ? 'white' : '#9333ea' }}>
                  {badge}
                </span>
              )}
            </button>
          )
        })}

        {/* Clear all filters */}
        {filtersActive && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium text-gray-400 hover:text-gray-600 transition-colors ml-1"
          >
            <X className="w-3 h-3" />Clear
          </button>
        )}
      </div>

      {/* Status sub-filter — disabled when in Attention mode (redundant there) */}
      <div className="flex gap-1.5 flex-wrap mb-6">
        {STATUS_FILTERS.map(f => {
          const active   = statusFilter === f.value
          const disabled = collabFilter === 'attention'
          return (
            <button
              key={f.value}
              onClick={() => !disabled && applyFilter(collabFilter, f.value)}
              disabled={disabled}
              className="text-[11px] px-2.5 py-1 rounded-md font-medium transition-colors"
              style={{
                background: active && !disabled ? 'rgba(28,43,58,0.08)' : 'transparent',
                color: disabled ? '#d1d5db' : active ? '#1C2B3A' : '#9ca3af',
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            >
              {f.label}
            </button>
          )
        })}
        {collabFilter === 'attention' && (
          <span className="text-[11px] text-gray-300 px-2.5 py-1 italic" style={{ fontFamily: "'Inter', sans-serif" }}>
            Status filter paused in Attention mode
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-5 h-5 rounded-full border-2 border-[#F5B800] border-t-transparent animate-spin" />
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={{ border: '1.5px dashed rgba(0,0,0,0.1)' }}>
          <p className="text-sm text-gray-400 mb-3">No collabs match your filters.</p>
          {filtersActive && (
            <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-[#1C2B3A] underline transition-colors">
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden bg-white" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
          {filteredGroups.map((group, gi) => {
            const isRetainer     = group.invite_type === 'retainer'
            const bizName        = group.business?.business_name ?? group.business?.display_name ?? '—'
            const isExpanded     = expanded.has(group.id)
            const isLast         = gi === filteredGroups.length - 1
            const needsAttention = group.matches.some(m => m.status === 'posted')

            return (
              <div key={group.id} style={{ borderBottom: isLast && !isExpanded ? 'none' : '1px solid rgba(0,0,0,0.06)' }}>

                {/* ── Collab row ── */}
                <button
                  className="w-full flex items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-gray-50/70"
                  onClick={() => toggleExpand(group.id)}
                >
                  {/* Attention indicator — only shows when action is needed */}
                  <div
                    className="w-2 h-2 rounded-full shrink-0 transition-colors"
                    style={{ background: needsAttention ? '#C084FC' : 'transparent', border: needsAttention ? 'none' : '1.5px solid #e5e7eb' }}
                    title={needsAttention ? 'Posted' : undefined}
                  />

                  {/* Business avatar */}
                  {group.business?.avatar_url ? (
                    <img src={group.business.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 ring-2 ring-white shadow-sm" />
                  ) : (
                    <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-sm font-bold text-white ring-2 ring-white shadow-sm" style={{ background: 'linear-gradient(135deg, #1C2B3A, #2d4a63)' }}>
                      {bizName[0]?.toUpperCase()}
                    </div>
                  )}

                  {/* Title + business + match summary */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-[#1C2B3A]">{group.title}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded" style={{ background: isRetainer ? 'rgba(96,165,250,0.12)' : 'rgba(245,184,0,0.1)', color: isRetainer ? '#1d4ed8' : '#b45309', fontFamily: "'JetBrains Mono', monospace" }}>
                        {isRetainer ? 'retainer' : 'one-off'}
                      </span>
                      {!group.is_active && (
                        <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-gray-100 text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>closed</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <p className="text-xs text-gray-400">{bizName}{group.business?.category ? ` · ${group.business.category}` : ''}</p>
                      {group.matches.length > 0 && <MatchSummary matches={group.matches} />}
                    </div>
                  </div>

                  {/* Inline slot bar */}
                  <SlotBar total={group.slots_total} claimed={group.slots_claimed} inline />

                  <ChevronDown className="w-4 h-4 shrink-0 transition-transform duration-200" style={{ color: '#d1d5db', transform: isExpanded ? 'rotate(180deg)' : 'none' }} />
                </button>

                {/* ── Expanded panel ── */}
                {isExpanded && (
                  <div className="flex flex-col sm:flex-row" style={{ background: '#f8f9fb', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                    <div className="p-5 sm:w-56 lg:w-64 sm:shrink-0" style={{ borderRight: '1px solid rgba(0,0,0,0.06)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                      <CollabDetail group={group} />
                    </div>
                    <div className="flex-1 py-3 min-w-0">
                      {group.matches.length === 0 ? (
                        <p className="text-sm text-gray-400 px-4 py-2">
                          {group.originalMatchCount > 0
                            ? `No ${STATUS_META[statusFilter as MatchStatus]?.label.toLowerCase() ?? ''} matches.`
                            : 'No creators matched yet.'}
                        </p>
                      ) : (
                        <div className="flex flex-col gap-0.5 px-2">
                          {[...group.matches]
                            .sort((a, b) => (MATCH_ORDER[a.status] ?? 5) - (MATCH_ORDER[b.status] ?? 5))
                            .map(match => <CreatorRow key={match.id} match={match} isRetainer={isRetainer} />)}
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
