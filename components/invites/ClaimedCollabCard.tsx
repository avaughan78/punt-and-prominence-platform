'use client'
import { useState } from 'react'
import { Pencil, Trash2, ExternalLink, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { EditInviteModal } from '@/components/invites/EditInviteModal'
import { formatGBP } from '@/lib/utils'
import type { Invite, MatchPreview } from '@/lib/types'

const STATUS_COLOUR: Record<string, { border: string; bg: string; text: string; label: string }> = {
  accepted:  { border: '#F5B800', bg: 'rgba(245,184,0,0.15)',    text: '#b45309', label: 'Awaiting content' },
  posted:    { border: '#C084FC', bg: 'rgba(192,132,252,0.15)',  text: '#9333ea', label: 'Posted' },
  verified:  { border: '#22c55e', bg: 'rgba(34,197,94,0.12)',    text: '#16a34a', label: 'Verified' },
  active:    { border: '#6BE6B0', bg: 'rgba(107,230,176,0.15)',  text: '#059669', label: 'Active' },
  completed: { border: '#94a3b8', bg: 'rgba(148,163,184,0.15)',  text: '#64748b', label: 'Complete' },
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

function timeAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 14) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function CreatorMiniCard({ match }: { match: MatchPreview }) {
  const colours = STATUS_COLOUR[match.status] ?? STATUS_COLOUR.pending
  const creator = match.creator
  const handle = creator?.instagram_handle
  const name = creator?.display_name ?? 'Creator'
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const isDone = match.status === 'verified' || match.status === 'completed'
  const hasPost = !!(match.post_url && (match.status === 'posted' || match.status === 'verified'))

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: '#ffffff',
        border: isDone ? '1.5px solid rgba(34,197,94,0.3)' : '1px solid rgba(0,0,0,0.07)',
        boxShadow: isDone ? '0 0 0 3px rgba(34,197,94,0.06), 0 1px 6px rgba(0,0,0,0.04)' : '0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      {/* Status strip */}
      <div style={{ height: '3px', background: colours.border }} />

      <div className="flex flex-col items-center gap-2 px-3 py-4 text-center">
        {/* Avatar */}
        <div className="relative">
          <div
            className="p-[2.5px] rounded-full"
            style={{ background: handle ? 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)' : 'rgba(0,0,0,0.1)' }}
          >
            {creator?.avatar_url ? (
              <img
                src={creator.avatar_url}
                alt={name}
                className="w-14 h-14 rounded-full object-cover block"
                style={{ border: '2.5px solid white' }}
              />
            ) : (
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #1C2B3A, #6BE6B0)', border: '2.5px solid white', fontSize: '15px' }}
              >
                {initials}
              </div>
            )}
          </div>
          {isDone && (
            <div
              className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: '#22c55e', border: '2px solid white' }}
            >
              <Check className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </div>

        {/* Identity */}
        <div className="min-w-0 w-full">
          <p className="font-bold text-xs text-[#1C2B3A] truncate" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            {handle ? `@${handle}` : name}
          </p>
          {handle && name && (
            <p className="text-[10px] text-gray-400 truncate">{name}</p>
          )}
          {creator?.follower_count != null && (
            <p className="text-[10px] text-gray-400 mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {fmt(creator.follower_count)} followers
            </p>
          )}
        </div>

        {/* Status badge */}
        <span
          className="text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
          style={{ background: colours.bg, color: colours.text, fontFamily: "'JetBrains Mono', monospace" }}
        >
          {colours.label}
        </span>

        {/* Post link */}
        {hasPost && (
          <a
            href={match.post_url!}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] font-medium hover:underline"
            style={{ color: '#3b82f6' }}
          >
            <ExternalLink className="w-2.5 h-2.5" />
            View post
          </a>
        )}

        {/* Punt code + date */}
        <div>
          <p className="text-[9px] font-bold tracking-widest text-gray-300" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {match.punt_code}
          </p>
          <p className="text-[9px] text-gray-300 mt-0.5">Claimed {timeAgo(match.created_at)}</p>
        </div>
      </div>
    </div>
  )
}

interface Props {
  invite: Invite
  onToggle: (id: string, active: boolean) => void
  onDelete: (id: string) => void
  onUpdated: (updated: Invite) => void
}

export function ClaimedCollabCard({ invite, onToggle, onDelete, onUpdated }: Props) {
  const [editing, setEditing] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const matches = invite.matches ?? []
  const isRetainer = invite.invite_type === 'retainer'

  const counts = matches.reduce((acc, m) => {
    acc[m.status] = (acc[m.status] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  const doneCount = (counts.verified ?? 0) + (counts.completed ?? 0)
  const totalCount = matches.length
  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  async function handleToggle() {
    setToggling(true)
    const res = await fetch(`/api/invites/${invite.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !invite.is_active }),
    })
    if (res.ok) onToggle(invite.id, !invite.is_active)
    else toast.error('Failed to update collab')
    setToggling(false)
  }

  async function handleDelete() {
    if (!confirm(`Delete "${invite.title}"? This can't be undone.`)) return
    setDeleting(true)
    const res = await fetch(`/api/invites/${invite.id}`, { method: 'DELETE' })
    if (res.ok) onDelete(invite.id)
    else { toast.error('Failed to delete collab'); setDeleting(false) }
  }

  const statusOrder = ['accepted', 'active', 'posted', 'verified', 'completed']
  const sortedMatches = [...matches].sort((a, b) => statusOrder.indexOf(b.status) - statusOrder.indexOf(a.status))

  return (
    <>
      {editing && (
        <EditInviteModal invite={invite} onClose={() => setEditing(false)} onSaved={onUpdated} />
      )}

      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
      >
        {/* ── Navy header ── */}
        <div style={{ background: 'linear-gradient(135deg, #1C2B3A 0%, #243d56 100%)', padding: '20px 24px 18px' }}>
          {/* Badges + status chips */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span
              className="text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontFamily: "'JetBrains Mono', monospace" }}
            >
              {invite.category}
            </span>
            <span
              className="text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-lg"
              style={{
                background: isRetainer ? 'rgba(107,230,176,0.15)' : 'rgba(245,184,0,0.15)',
                color: isRetainer ? '#6BE6B0' : '#F5B800',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {isRetainer ? 'Retainer' : 'One-off'}
            </span>

            <div className="ml-auto flex items-center gap-1.5 flex-wrap justify-end">
              {statusOrder.filter(s => counts[s]).map(s => {
                const col = STATUS_COLOUR[s]
                return (
                  <span
                    key={s}
                    className="text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                    style={{ background: col.bg, color: col.text, fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {counts[s]} {col.label.toLowerCase()}
                  </span>
                )
              })}
            </div>
          </div>

          {/* Title + value */}
          <div className="flex items-start justify-between gap-4">
            <h2
              className="font-bold text-white text-lg leading-snug"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              {invite.title}
            </h2>
            <div className="shrink-0 text-right">
              <p
                className="font-bold text-xl leading-none"
                style={{ color: isRetainer ? '#6BE6B0' : '#F5B800', fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                {isRetainer ? formatGBP(invite.fee_gbp ?? 0) : formatGBP(invite.value_gbp)}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono', monospace" }}>
                {isRetainer ? '/month' : 'value'}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          {totalCount > 0 && (
            <div className="mt-4">
              <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div
                  style={{
                    width: `${progressPct}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #6BE6B0, #22c55e)',
                    borderRadius: '100px',
                    transition: 'width 0.6s ease',
                  }}
                />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: "'JetBrains Mono', monospace" }}>
                  {doneCount}/{totalCount} {isRetainer ? 'active' : 'verified'}
                </p>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: "'JetBrains Mono', monospace" }}>
                  {totalCount} creator{totalCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Creator gallery ── */}
        <div style={{ background: '#f4f6f8', padding: '20px 24px' }}>
          {sortedMatches.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: '#9ca3af' }}>No creators yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {sortedMatches.map(m => (
                <CreatorMiniCard key={m.id} match={m} />
              ))}
            </div>
          )}
        </div>

        {/* ── Footer controls ── */}
        <div
          className="flex items-center gap-2 px-6 py-3"
          style={{ background: 'white', borderTop: '1px solid rgba(0,0,0,0.06)' }}
        >
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-[#1C2B3A] transition-colors px-2.5 py-1.5 rounded-lg hover:bg-gray-100"
          >
            <Pencil className="w-3 h-3" />
            Edit
          </button>
          <Button
            size="sm"
            variant={invite.is_active ? 'ghost' : 'secondary'}
            loading={toggling}
            onClick={handleToggle}
          >
            {invite.is_active ? 'Pause' : 'Activate'}
          </Button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="ml-auto p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </>
  )
}
