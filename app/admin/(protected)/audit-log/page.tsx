'use client'
import { useEffect, useState } from 'react'

interface AuditLog {
  id: string
  event_type: string
  actor: string
  subject_type: string
  subject_id: string
  metadata: Record<string, unknown>
  created_at: string
}

type Category = 'creator' | 'business' | 'match' | 'invite' | 'system'

const CATEGORY_COLOUR: Record<Category, { border: string; bg: string; text: string }> = {
  creator:  { border: '#F5B800', bg: 'rgba(245,184,0,0.08)',   text: '#b45309' },
  business: { border: '#6BE6B0', bg: 'rgba(107,230,176,0.08)', text: '#059669' },
  match:    { border: '#818cf8', bg: 'rgba(99,102,241,0.08)',   text: '#4f46e5' },
  invite:   { border: '#C084FC', bg: 'rgba(192,132,252,0.08)', text: '#9333ea' },
  system:   { border: '#94a3b8', bg: 'rgba(148,163,184,0.08)', text: '#64748b' },
}

const EVENT_META: Record<string, {
  category: Category
  label: string
  icon: string
  summary: (m: Record<string, unknown>) => string
}> = {
  'creator.registered':    { category: 'creator',  icon: '👤', label: 'Registered',     summary: m => `${m.display_name ?? 'New creator'} joined as a creator${m.email ? ` · ${m.email}` : ''}` },
  'creator.approved':      { category: 'creator',  icon: '✅', label: 'Approved',        summary: m => `${m.display_name ?? 'Creator'} was approved${m.instagram_handle ? ` · @${m.instagram_handle}` : ''}${m.follower_count ? ` · ${Number(m.follower_count).toLocaleString()} followers` : ''}` },
  'creator.rejected':      { category: 'creator',  icon: '❌', label: 'Rejected',        summary: m => `${m.display_name ?? 'Creator'} was rejected${m.reason ? ` — "${m.reason}"` : ''}` },
  'creator.revoked':       { category: 'creator',  icon: '🔒', label: 'Revoked',         summary: m => `Access revoked for ${m.display_name ?? 'creator'}${m.reason ? ` — "${m.reason}"` : ''}` },
  'creator.deleted':       { category: 'creator',  icon: '🗑️', label: 'Deleted',         summary: m => { const p = m.profile as Record<string,unknown>|null; const n = p?.display_name ?? m.display_name ?? 'Creator'; const mc = Array.isArray(m.matches) ? (m.matches as unknown[]).length : 0; return `${n} was deleted${m.email ? ` · ${m.email}` : ''}${mc > 0 ? ` · ${mc} match${mc !== 1 ? 'es' : ''} removed` : ''}` } },
  'business.registered':   { category: 'business', icon: '🏪', label: 'Registered',     summary: m => `${m.display_name ?? 'New business'} joined as a business${m.email ? ` · ${m.email}` : ''}` },
  'business.suspended':    { category: 'business', icon: '⏸️', label: 'Suspended',       summary: m => `${m.business_name ?? 'Business'} was suspended${m.reason ? ` — "${m.reason}"` : ''}` },
  'business.unsuspended':  { category: 'business', icon: '▶️', label: 'Reinstated',      summary: m => `${m.business_name ?? 'Business'} was reinstated` },
  'business.deleted':      { category: 'business', icon: '🗑️', label: 'Deleted',         summary: m => { const p = m.profile as Record<string,unknown>|null; const n = p?.business_name ?? m.business_name ?? 'Business'; const mc = Array.isArray(m.matches) ? (m.matches as unknown[]).length : 0; return `${n} was deleted${m.email ? ` · ${m.email}` : ''}${mc > 0 ? ` · ${mc} match${mc !== 1 ? 'es' : ''} removed` : ''}` } },
  'match.created':         { category: 'match',    icon: '🤝', label: 'Match created',   summary: m => `${m.creator_name ?? 'Creator'} claimed "${m.offer_title ?? 'a collab'}" from ${m.business_name ?? 'business'}${m.punt_code ? ` · ${m.punt_code}` : ''}` },
  'match.status_changed':  { category: 'match',    icon: '🔄', label: 'Status updated',  summary: m => `Match ${m.punt_code ?? ''} moved ${m.old_status ?? '?'} → ${m.new_status ?? m.status ?? '?'}${m.creator_name ? ` · ${m.creator_name}` : ''}${m.business_name ? ` @ ${m.business_name}` : ''}` },
  'invite.created':        { category: 'invite',   icon: '✨', label: 'Collab created',  summary: m => `"${m.title ?? 'New collab'}" created by ${m.business_name ?? 'business'}${m.invite_type ? ` · ${m.invite_type === 'retainer' ? 'retainer' : 'one-off'}` : ''}${m.slots_total ? ` · ${m.slots_total} slot${Number(m.slots_total) !== 1 ? 's' : ''}` : ''}` },
  'invite.deleted':        { category: 'invite',   icon: '🗑️', label: 'Collab deleted',  summary: m => `"${m.title ?? 'Collab'}" was deleted` },
  'invite_code.created':   { category: 'system',   icon: '🔑', label: 'Code created',    summary: m => `Invite code ${m.code ?? ''} created${m.reusable ? ' (reusable)' : ''}` },
  'waitlist.signup':       { category: 'system',   icon: '📋', label: 'Waitlist',        summary: m => `${m.email ?? 'Someone'} joined the waitlist` },
}

function getMeta(type: string) {
  return EVENT_META[type] ?? {
    category: 'system' as Category,
    icon: '•',
    label: type.split('.')[1] ?? type,
    summary: (m: Record<string, unknown>) => JSON.stringify(m),
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function fullDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function MetadataDetail({ type, metadata }: { type: string; metadata: Record<string, unknown> }) {
  const rows: { label: string; value: string }[] = []

  if (type.startsWith('creator.')) {
    if (metadata.email) rows.push({ label: 'Email', value: String(metadata.email) })
    if (metadata.instagram_handle) rows.push({ label: 'Instagram', value: `@${metadata.instagram_handle}` })
    if (metadata.follower_count != null) rows.push({ label: 'Followers', value: Number(metadata.follower_count).toLocaleString() })
    if (metadata.reason) rows.push({ label: 'Reason', value: String(metadata.reason) })
    if (type === 'creator.deleted' && Array.isArray(metadata.matches)) {
      rows.push({ label: 'Matches removed', value: String((metadata.matches as unknown[]).length) })
    }
  }
  if (type.startsWith('business.')) {
    const profile = metadata.profile as Record<string, unknown> | null
    if (metadata.email) rows.push({ label: 'Email', value: String(metadata.email) })
    if (profile?.address_line) rows.push({ label: 'Address', value: String(profile.address_line) })
    if (profile?.category) rows.push({ label: 'Category', value: String(profile.category) })
    if (metadata.reason) rows.push({ label: 'Reason', value: String(metadata.reason) })
    if (type === 'business.deleted' && Array.isArray(metadata.matches)) {
      rows.push({ label: 'Matches removed', value: String((metadata.matches as unknown[]).length) })
    }
  }
  if (type === 'match.created' || type === 'match.status_changed') {
    if (metadata.punt_code) rows.push({ label: 'Punt code', value: String(metadata.punt_code) })
    if (metadata.offer_title) rows.push({ label: 'Collab', value: String(metadata.offer_title) })
    if (metadata.old_status) rows.push({ label: 'From', value: String(metadata.old_status) })
    if (metadata.new_status ?? metadata.status) rows.push({ label: 'To', value: String(metadata.new_status ?? metadata.status) })
    if (metadata.creator_name) rows.push({ label: 'Creator', value: String(metadata.creator_name) })
    if (metadata.business_name) rows.push({ label: 'Business', value: String(metadata.business_name) })
  }
  if (type.startsWith('invite.')) {
    if (metadata.title) rows.push({ label: 'Title', value: String(metadata.title) })
    if (metadata.business_name) rows.push({ label: 'Business', value: String(metadata.business_name) })
    if (metadata.invite_type) rows.push({ label: 'Type', value: String(metadata.invite_type) })
    if (metadata.value_gbp != null) rows.push({ label: 'Value', value: `£${metadata.value_gbp}` })
    if (metadata.fee_gbp != null) rows.push({ label: 'Fee/mo', value: `£${metadata.fee_gbp}` })
    if (metadata.slots_total != null) rows.push({ label: 'Slots', value: String(metadata.slots_total) })
  }
  if (type.startsWith('invite_code.')) {
    if (metadata.code) rows.push({ label: 'Code', value: String(metadata.code) })
    if (metadata.reusable != null) rows.push({ label: 'Reusable', value: metadata.reusable ? 'Yes' : 'No' })
  }

  if (rows.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {rows.map(({ label, value }) => (
        <div key={label} className="rounded-lg px-3 py-1.5 flex gap-2 items-baseline" style={{ background: 'rgba(0,0,0,0.03)' }}>
          <span className="text-[10px] uppercase tracking-wide text-gray-400 shrink-0" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{label}</span>
          <span className="text-xs font-medium text-[#1C2B3A]">{value}</span>
        </div>
      ))}
    </div>
  )
}

const FILTER_OPTIONS = [
  { value: 'all',      label: 'All' },
  { value: 'creator',  label: 'Creators' },
  { value: 'business', label: 'Businesses' },
  { value: 'match',    label: 'Matches' },
  { value: 'invite',   label: 'Collabs' },
  { value: 'system',   label: 'System' },
] as const
type Filter = typeof FILTER_OPTIONS[number]['value']

export default function AdminAuditLog() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/audit-log')
      .then(r => r.json())
      .then(d => { setLogs(Array.isArray(d) ? d : []); setLoading(false) })
  }, [])

  const filtered = logs.filter(l => {
    if (filter === 'all') return true
    return getMeta(l.event_type).category === filter
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Audit log</h1>
          <p className="text-sm text-gray-500 mt-0.5">{logs.length} events</p>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {FILTER_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors"
              style={{
                background: filter === value ? '#1C2B3A' : 'white',
                color: filter === value ? 'white' : '#6b7280',
                border: '1px solid rgba(0,0,0,0.1)',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : !filtered.length ? (
        <p className="text-sm text-gray-400">No events yet.</p>
      ) : (
        <div className="rounded-2xl overflow-hidden bg-white" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
          {filtered.map((log, i) => {
            const meta = getMeta(log.event_type)
            const colours = CATEGORY_COLOUR[meta.category]
            const isOpen = expanded === log.id
            const summary = meta.summary(log.metadata)

            return (
              <div
                key={log.id}
                style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}
              >
                <button
                  className="w-full flex items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50/60"
                  onClick={() => setExpanded(isOpen ? null : log.id)}
                >
                  {/* Left colour bar */}
                  <div className="w-1 self-stretch rounded-full shrink-0 mt-0.5" style={{ background: colours.border, minHeight: '20px' }} />

                  {/* Icon + label pill */}
                  <div className="shrink-0 mt-0.5">
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-lg"
                      style={{ background: colours.bg, color: colours.text, fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      <span>{meta.icon}</span>
                      <span>{meta.label}</span>
                    </span>
                  </div>

                  {/* Summary + detail */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#1C2B3A] leading-snug">{summary}</p>
                    {isOpen && <MetadataDetail type={log.event_type} metadata={log.metadata} />}
                    <p className="text-xs text-gray-400 mt-1">
                      {log.actor !== 'system' && log.actor !== process.env.NEXT_PUBLIC_ADMIN_EMAIL && (
                        <span className="mr-2">{log.actor}</span>
                      )}
                    </p>
                  </div>

                  {/* Time */}
                  <div className="shrink-0 text-right mt-0.5">
                    <p className="text-xs font-medium text-gray-500">{timeAgo(log.created_at)}</p>
                    <p className="text-[10px] text-gray-300 mt-0.5">{fullDate(log.created_at)}</p>
                  </div>
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
