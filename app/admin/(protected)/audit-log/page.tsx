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

const EVENT_CONFIG: Record<string, { label: string; bg: string; color: string; summary: (m: Record<string, unknown>) => string }> = {
  'creator.approved':     { label: 'Approved',    bg: 'rgba(107,230,176,0.15)', color: '#059669', summary: m => `Approved ${m.display_name ?? ''}${m.email ? ` (${m.email})` : ''}${m.instagram_handle ? ` · @${m.instagram_handle}` : ''}` },
  'creator.rejected':     { label: 'Rejected',    bg: 'rgba(239,68,68,0.1)',   color: '#dc2626', summary: m => `Rejected ${m.display_name ?? ''}${m.reason ? ` — "${m.reason}"` : ''}` },
  'creator.revoked':      { label: 'Revoked',     bg: 'rgba(245,184,0,0.12)',  color: '#b45309', summary: m => `Revoked access for ${m.display_name ?? ''}${m.reason ? ` — "${m.reason}"` : ''}` },
  'creator.deleted':      { label: 'Deleted',     bg: 'rgba(239,68,68,0.1)',   color: '#dc2626', summary: m => { const p = m.profile as Record<string, unknown> | null; return `Deleted creator ${p?.display_name ?? m.display_name ?? ''}${m.email ? ` (${m.email})` : ''}${Array.isArray(m.matches) ? ` · ${(m.matches as unknown[]).length} match${(m.matches as unknown[]).length !== 1 ? 'es' : ''} removed` : ''}` } },
  'business.suspended':   { label: 'Suspended',   bg: 'rgba(245,184,0,0.12)',  color: '#b45309', summary: m => `Suspended ${m.business_name ?? ''}${m.reason ? ` — "${m.reason}"` : ''}` },
  'business.unsuspended': { label: 'Reinstated',  bg: 'rgba(107,230,176,0.15)', color: '#059669', summary: m => `Reinstated ${m.business_name ?? ''}` },
  'business.deleted':     { label: 'Deleted',     bg: 'rgba(239,68,68,0.1)',   color: '#dc2626', summary: m => { const p = m.profile as Record<string, unknown> | null; return `Deleted business ${p?.business_name ?? m.business_name ?? ''}${m.email ? ` (${m.email})` : ''}${Array.isArray(m.matches) ? ` · ${(m.matches as unknown[]).length} match${(m.matches as unknown[]).length !== 1 ? 'es' : ''} removed` : ''}` } },
  'match.status_changed': { label: 'Match',       bg: 'rgba(99,102,241,0.1)',  color: '#4f46e5', summary: m => `Match ${m.punt_code ?? ''} → ${m.new_status ?? m.status ?? ''}${m.creator_name ? ` · ${m.creator_name}` : ''}` },
  'invite.created':       { label: 'Collab',      bg: 'rgba(107,230,176,0.15)', color: '#059669', summary: m => `New collab: "${m.title ?? ''}"${m.business_name ? ` by ${m.business_name}` : ''}` },
  'invite.deleted':       { label: 'Collab del',  bg: 'rgba(239,68,68,0.1)',   color: '#dc2626', summary: m => `Deleted collab: "${m.title ?? ''}"` },
  'invite_code.created':  { label: 'Code',        bg: 'rgba(107,230,176,0.15)', color: '#059669', summary: m => `Created invite code ${m.code ?? ''}${m.reusable ? ' (reusable)' : ''}` },
  'invite_code.used':     { label: 'Code used',   bg: 'rgba(99,102,241,0.1)',  color: '#4f46e5', summary: m => `Code ${m.code ?? ''} used by ${m.email ?? m.used_by ?? ''}` },
  'waitlist.signup':      { label: 'Waitlist',    bg: 'rgba(245,184,0,0.12)',  color: '#b45309', summary: m => `${m.email ?? ''} joined the waitlist` },
}

function eventConfig(type: string) {
  return EVENT_CONFIG[type] ?? { label: type.split('.')[1] ?? type, bg: 'rgba(0,0,0,0.06)', color: '#6b7280', summary: (m: Record<string, unknown>) => JSON.stringify(m) }
}

function subjectName(log: AuditLog): string {
  const m = log.metadata
  if (log.subject_type === 'business') return (m.business_name as string) ?? (m.profile as Record<string, string> | null)?.business_name ?? log.subject_id
  if (log.subject_type === 'creator') return (m.display_name as string) ?? (m.profile as Record<string, string> | null)?.display_name ?? log.subject_id
  return ''
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

  if (type === 'match.status_changed') {
    if (metadata.punt_code) rows.push({ label: 'Punt code', value: String(metadata.punt_code) })
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
    if (metadata.slots_total != null) rows.push({ label: 'Slots', value: String(metadata.slots_total) })
  }

  if (type.startsWith('invite_code.')) {
    if (metadata.code) rows.push({ label: 'Code', value: String(metadata.code) })
    if (metadata.reusable != null) rows.push({ label: 'Reusable', value: metadata.reusable ? 'Yes' : 'No' })
    if (metadata.email) rows.push({ label: 'Used by', value: String(metadata.email) })
  }

  if (rows.length === 0) {
    return (
      <pre className="text-xs rounded-xl p-3 overflow-auto max-h-40" style={{ background: 'rgba(0,0,0,0.03)', color: '#374151', fontFamily: "'JetBrains Mono', monospace" }}>
        {JSON.stringify(metadata, null, 2)}
      </pre>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {rows.map(({ label, value }) => (
        <div key={label} className="rounded-lg px-3 py-2" style={{ background: 'rgba(0,0,0,0.03)' }}>
          <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{label}</p>
          <p className="text-xs font-medium text-[#1C2B3A] break-all">{value}</p>
        </div>
      ))}
    </div>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const FILTER_OPTIONS = [
  { value: 'all',      label: 'All' },
  { value: 'creator',  label: 'Creators' },
  { value: 'business', label: 'Businesses' },
  { value: 'match',    label: 'Matches' },
  { value: 'invite',   label: 'Collabs' },
] as const
type Filter = typeof FILTER_OPTIONS[number]['value']

export default function AdminAuditLog() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    fetch('/api/admin/audit-log')
      .then(r => r.json())
      .then(d => { setLogs(Array.isArray(d) ? d : []); setLoading(false) })
  }, [])

  const filtered = logs.filter(l => {
    if (filter === 'all') return true
    if (filter === 'invite') return l.subject_type === 'invite' || l.event_type.startsWith('invite')
    return l.subject_type === filter || l.event_type.startsWith(filter + '.')
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Audit log</h1>
          <p className="text-sm text-gray-500 mt-0.5">{logs.length} events</p>
        </div>
        <div className="flex gap-2 flex-wrap">
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
            const cfg = eventConfig(log.event_type)
            const isOpen = expanded === log.id
            const name = subjectName(log)

            return (
              <div key={log.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : log.id)}
                >
                  <span
                    className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-lg shrink-0 w-20 text-center"
                    style={{ background: cfg.bg, color: cfg.color, fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {cfg.label}
                  </span>
                  <span className="text-xs text-gray-500 flex-1 truncate">{cfg.summary(log.metadata)}</span>
                  {name && <span className="text-xs text-gray-400 shrink-0 hidden sm:block">{name}</span>}
                  <span className="text-xs text-gray-300 shrink-0 hidden md:block">{log.actor}</span>
                  <span className="text-xs text-gray-400 shrink-0 ml-2">{formatDate(log.created_at)}</span>
                  <span className="text-gray-300 text-xs ml-1">{isOpen ? '▲' : '▼'}</span>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-1" style={{ background: 'rgba(0,0,0,0.015)' }}>
                    <MetadataDetail type={log.event_type} metadata={log.metadata} />
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
