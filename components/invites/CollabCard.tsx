'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { MessageCircle, Pencil, Trash2, ExternalLink, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { EditInviteModal } from '@/components/invites/EditInviteModal'
import { InlineMessageThread } from '@/components/matches/InlineMessageThread'
import { formatGBP } from '@/lib/utils'
import type { Invite, MatchPreview } from '@/lib/types'

const STATUS_META: Record<string, { bg: string; text: string; label: string }> = {
  accepted:  { bg: 'rgba(245,184,0,0.12)',   text: '#b45309', label: 'Awaiting content' },
  posted:    { bg: 'rgba(192,132,252,0.12)', text: '#9333ea', label: 'Post ready' },
  verified:  { bg: 'rgba(34,197,94,0.1)',    text: '#16a34a', label: 'Complete' },
  active:    { bg: 'rgba(107,230,176,0.12)', text: '#059669', label: 'Active' },
  completed: { bg: 'rgba(148,163,184,0.12)', text: '#64748b', label: 'Complete' },
}

// Most urgent first
const STATUS_PRIORITY: Record<string, number> = {
  posted: 0, accepted: 1, active: 2, verified: 3, completed: 4,
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

interface CreatorRowProps {
  match: MatchPreview
  isRetainer: boolean
  currentUserId: string
  onStatusUpdated: (matchId: string, status: string) => void
}

function CreatorRow({ match, isRetainer, currentUserId, onStatusUpdated }: CreatorRowProps) {
  const [msgOpen, setMsgOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const msgRef = useRef<HTMLDivElement>(null)

  const meta = STATUS_META[match.status] ?? STATUS_META.pending
  const creator = match.creator
  const handle = creator?.instagram_handle
  const name = creator?.display_name ?? 'Creator'
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const isDone = match.status === 'verified' || match.status === 'completed'

  useEffect(() => {
    fetch(`/api/matches/${match.id}/messages/unread`)
      .then(r => r.json())
      .then(d => setUnread(d.count ?? 0))
      .catch(() => {})
  }, [match.id])

  async function updateStatus(status: string) {
    setLoading(true)
    const res = await fetch(`/api/matches/${match.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    const data = await res.json()
    if (!res.ok) toast.error(data.error ?? 'Failed to update')
    else { toast.success('Updated'); onStatusUpdated(match.id, status) }
    setLoading(false)
  }

  useEffect(() => {
    if (msgOpen) {
      setTimeout(() => msgRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50)
    }
  }, [msgOpen])

  function toggleMsg() {
    setMsgOpen(o => !o)
    if (!msgOpen) setUnread(0)
  }

  const statusLabel = match.status === 'accepted' && isRetainer ? 'Awaiting activation' : meta.label

  return (
    <div>
      <div
        className="flex items-center gap-3 px-5 py-3"
        style={{ borderTop: '1px solid rgba(0,0,0,0.06)', background: '#ffffff' }}
      >
        {/* Avatar + identity — links to creator profile */}
        <Link
          href={`/business/creators/${creator?.id}`}
          className="flex items-center gap-3 flex-1 min-w-0 group"
        >
          <div
            className="p-[2px] rounded-full flex-shrink-0 transition-opacity group-hover:opacity-80"
            style={{ background: handle ? 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)' : 'rgba(0,0,0,0.1)' }}
          >
            {creator?.avatar_url ? (
              <img
                src={creator.avatar_url}
                alt={name}
                className="w-9 h-9 rounded-full object-cover block"
                style={{ border: '2px solid white' }}
              />
            ) : (
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #1C2B3A, #6BE6B0)', border: '2px solid white' }}
              >
                {initials}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm text-[#1C2B3A] truncate group-hover:underline underline-offset-2" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              {handle ? `@${handle}` : name}
            </p>
            {creator?.follower_count != null && (
              <p className="text-[11px] text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {fmt(creator.follower_count)} followers
              </p>
            )}
          </div>
        </Link>

        {/* Status badge */}
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0"
          style={{ background: meta.bg, color: meta.text, fontFamily: "'JetBrains Mono', monospace" }}
        >
          {statusLabel}
        </span>

        {/* Quick actions */}
        {!isRetainer && match.status === 'posted' && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {match.post_url && (
              <a
                href={match.post_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-600 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <Button size="sm" loading={loading} onClick={() => updateStatus('verified')}>
              Verify
            </Button>
          </div>
        )}

        {isRetainer && match.status === 'accepted' && (
          <Button size="sm" loading={loading} onClick={() => updateStatus('active')} className="flex-shrink-0">
            Activate
          </Button>
        )}

        {isDone && (
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: '#22c55e' }}
          >
            <Check className="w-3 h-3 text-white" />
          </div>
        )}

        {/* Message button — headline feature */}
        <button
          onClick={toggleMsg}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex-shrink-0"
          style={{
            background: msgOpen
              ? '#1C2B3A'
              : unread > 0
                ? '#F5B800'
                : 'rgba(28,43,58,0.06)',
            color: msgOpen ? 'white' : unread > 0 ? '#1C2B3A' : '#6b7280',
          }}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          {unread > 0 && !msgOpen ? `${unread} new` : 'Message'}
        </button>
      </div>

      {/* Inline thread — expands below row */}
      {msgOpen && (
        <div ref={msgRef} className="px-5 pb-4">
          <InlineMessageThread matchId={match.id} currentUserId={currentUserId} />
        </div>
      )}
    </div>
  )
}

interface Props {
  invite: Invite
  currentUserId: string
  onToggle: (id: string, active: boolean) => void
  onDelete: (id: string) => void
  onUpdated: (updated: Invite) => void
  onViewDetail?: (invite: Invite) => void
}

export function CollabCard({ invite, currentUserId, onToggle, onDelete, onUpdated, onViewDetail }: Props) {
  const [editing, setEditing] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [matches, setMatches] = useState<MatchPreview[]>(invite.matches ?? [])

  useEffect(() => { setMatches(invite.matches ?? []) }, [invite.matches])

  const isRetainer = invite.invite_type === 'retainer'
  const isFull = invite.slots_claimed >= invite.slots_total
  const isActive = invite.is_active
  const hasLiveMatches = matches.some(m => !['verified', 'completed'].includes(m.status))

  const stripColor = !isActive
    ? '#94a3b8'
    : isFull ? '#22c55e'
    : isRetainer ? '#6BE6B0'
    : '#F5B800'

  async function handleToggle() {
    setToggling(true)
    const res = await fetch(`/api/invites/${invite.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !invite.is_active }),
    })
    if (res.ok) {
      onToggle(invite.id, !invite.is_active)
    } else {
      const body = await res.json().catch(() => ({}))
      toast.error(body.error ?? 'Failed to update collab')
    }
    setToggling(false)
  }

  async function handleDelete() {
    if (!confirm(`Delete "${invite.title}"? This can't be undone.`)) return
    setDeleting(true)
    const res = await fetch(`/api/invites/${invite.id}`, { method: 'DELETE' })
    if (res.ok) onDelete(invite.id)
    else { toast.error('Failed to delete collab'); setDeleting(false) }
  }

  function handleStatusUpdated(matchId: string, status: string) {
    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, status: status as MatchPreview['status'] } : m))
  }

  const sortedMatches = [...matches].sort(
    (a, b) => (STATUS_PRIORITY[a.status] ?? 3) - (STATUS_PRIORITY[b.status] ?? 3)
  )

  return (
    <>
      {editing && <EditInviteModal invite={invite} onClose={() => setEditing(false)} onSaved={onUpdated} />}

      <div
        className="bg-white rounded-2xl overflow-hidden"
        style={{ border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
      >
        {/* Thin color strip */}
        <div style={{ height: '4px', background: stripColor }} />

        {/* Compact header */}
        <div className="px-5 pt-4 pb-3.5">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <button
                onClick={() => onViewDetail?.(invite)}
                className="font-bold text-[#1C2B3A] leading-snug text-left hover:underline decoration-[#1C2B3A]/30 underline-offset-2 transition-colors"
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '16px' }}
              >
                {invite.title}
              </button>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span
                  className="text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md"
                  style={{
                    background: isRetainer ? 'rgba(107,230,176,0.15)' : 'rgba(245,184,0,0.12)',
                    color: isRetainer ? '#059669' : '#b45309',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {isRetainer ? 'Retainer' : 'One-off'}
                </span>
                {!isActive && (
                  <span
                    className="text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md"
                    style={{ background: 'rgba(0,0,0,0.06)', color: '#9ca3af', fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    Paused
                  </span>
                )}
                {isActive && !isRetainer && (
                  <span className="text-[10px] text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {invite.slots_claimed}/{invite.slots_total} claimed
                  </span>
                )}
                {isActive && isRetainer && invite.posts_per_month != null && (
                  <span className="text-[10px] text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {invite.posts_per_month} post{invite.posts_per_month !== 1 ? 's' : ''}/month
                  </span>
                )}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p
                className="font-bold leading-none"
                style={{
                  color: isRetainer ? '#059669' : '#b45309',
                  fontFamily: "'Bricolage Grotesque', sans-serif",
                  fontSize: '18px',
                }}
              >
                {isRetainer ? formatGBP(invite.fee_gbp ?? 0) : formatGBP(invite.value_gbp)}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {isRetainer ? '/month' : 'value'}
              </p>
            </div>
          </div>
        </div>

        {/* Creator rows */}
        {sortedMatches.length === 0 ? (
          <div className="px-5 py-4 text-xs text-gray-400 italic" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
            No creators matched yet — your collab is live.
          </div>
        ) : (
          sortedMatches.map(m => (
            <CreatorRow
              key={m.id}
              match={m}
              isRetainer={isRetainer}
              currentUserId={currentUserId}
              onStatusUpdated={handleStatusUpdated}
            />
          ))
        )}

        {/* Footer */}
        <div
          className="flex items-center gap-2 px-5 py-3"
          style={{ borderTop: '1px solid rgba(0,0,0,0.06)', background: '#ffffff' }}
        >
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-[#1C2B3A] hover:bg-white transition-colors"
          >
            <Pencil className="w-3 h-3" />
            Edit
          </button>
          <Button
            size="sm"
            variant={isActive ? 'ghost' : 'secondary'}
            loading={toggling}
            disabled={isActive && hasLiveMatches}
            title={isActive && hasLiveMatches ? 'Cannot pause — creators still in progress' : undefined}
            onClick={handleToggle}
          >
            {isActive ? 'Pause' : 'Activate'}
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
