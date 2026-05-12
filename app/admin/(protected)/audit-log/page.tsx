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

const EVENT_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  'business.deleted':    { label: 'Deleted',     bg: 'rgba(239,68,68,0.1)',   color: '#dc2626' },
  'business.suspended':  { label: 'Suspended',   bg: 'rgba(245,184,0,0.12)',  color: '#b45309' },
  'business.unsuspended':{ label: 'Reinstated',  bg: 'rgba(107,230,176,0.15)',color: '#059669' },
  'creator.deleted':     { label: 'Deleted',     bg: 'rgba(239,68,68,0.1)',   color: '#dc2626' },
  'creator.approved':    { label: 'Approved',    bg: 'rgba(107,230,176,0.15)',color: '#059669' },
  'creator.rejected':    { label: 'Rejected',    bg: 'rgba(239,68,68,0.1)',   color: '#dc2626' },
  'creator.revoked':     { label: 'Revoked',     bg: 'rgba(245,184,0,0.12)',  color: '#b45309' },
  'match.status_changed':{ label: 'Match',       bg: 'rgba(99,102,241,0.1)',  color: '#4f46e5' },
  'invite.created':      { label: 'Invite',      bg: 'rgba(107,230,176,0.15)',color: '#059669' },
  'invite.deleted':      { label: 'Invite del',  bg: 'rgba(239,68,68,0.1)',   color: '#dc2626' },
}

function eventStyle(type: string) {
  return EVENT_STYLES[type] ?? { label: type, bg: 'rgba(0,0,0,0.06)', color: '#6b7280' }
}

function subjectName(log: AuditLog): string {
  const m = log.metadata
  if (log.subject_type === 'business') {
    return (m.business_name as string) ?? (m.profile as Record<string, string> | null)?.business_name ?? log.subject_id
  }
  if (log.subject_type === 'creator') {
    return (m.display_name as string) ?? (m.profile as Record<string, string> | null)?.display_name ?? log.subject_id
  }
  return log.subject_id
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function AdminAuditLog() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'business' | 'creator'>('all')

  useEffect(() => {
    fetch('/api/admin/audit-log')
      .then(r => r.json())
      .then(d => { setLogs(d); setLoading(false) })
  }, [])

  const filtered = logs.filter(l => {
    if (filter === 'all') return true
    return l.subject_type === filter
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Audit log</h1>
          <p className="text-sm text-gray-500 mt-0.5">{logs.length} events</p>
        </div>
        <div className="flex gap-2">
          {(['all', 'business', 'creator'] as const).map(f => (
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
              {f}
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
            const style = eventStyle(log.event_type)
            const isOpen = expanded === log.id
            return (
              <div key={log.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : log.id)}
                >
                  <span
                    className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-lg shrink-0"
                    style={{ background: style.bg, color: style.color, fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {log.subject_type}
                  </span>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-lg shrink-0"
                    style={{ background: style.bg, color: style.color, fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {style.label}
                  </span>
                  <span className="text-sm font-semibold text-[#1C2B3A] flex-1 truncate">{subjectName(log)}</span>
                  <span className="text-xs text-gray-400 shrink-0">{log.actor}</span>
                  <span className="text-xs text-gray-400 shrink-0 ml-2">{formatDate(log.created_at)}</span>
                  <span className="text-gray-300 text-xs ml-1">{isOpen ? '▲' : '▼'}</span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4">
                    <pre
                      className="text-xs rounded-xl p-3 overflow-auto max-h-64"
                      style={{ background: 'rgba(0,0,0,0.03)', color: '#374151', fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
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
