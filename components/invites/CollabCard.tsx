'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { MessageCircle, Pencil, Trash2, Check, ChevronDown, ImageIcon, ExternalLink, Info, Users, MoreVertical, Lock, LockOpen } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { EditInviteModal } from '@/components/invites/EditInviteModal'
import { InlineMessageThread } from '@/components/matches/InlineMessageThread'
import { formatGBP } from '@/lib/utils'
import { deriveMatchState } from '@/lib/types'
import type { Invite, MatchPreview } from '@/lib/types'

const STATE_META: Record<string, { bg: string; text: string; label: string }> = {
  in_progress:  { bg: 'rgba(245,184,0,0.12)',   text: '#b45309', label: 'Awaiting posts' },
  needs_review: { bg: 'rgba(192,132,252,0.12)', text: '#9333ea', label: 'Needs review' },
  up_to_date:   { bg: 'rgba(34,197,94,0.1)',    text: '#16a34a', label: 'Up to date' },
  closed:       { bg: 'rgba(148,163,184,0.12)', text: '#64748b', label: 'Closed' },
}

const STATE_ORDER: Record<string, number> = { needs_review: 0, in_progress: 1, up_to_date: 2, closed: 3 }

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

function fmtDate(dt: string) {
  return new Date(dt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

interface CreatorRowProps {
  match: MatchPreview
  isRetainer: boolean
  currentUserId: string
  initialPostsOpen?: boolean
  expandPostsTrigger?: number
  expandMsgsTrigger?: number
  hasUnreadMessages?: boolean
  onDeliverableVerified: (matchId: string, deliverableId: string) => void
  onUnreadChange?: (matchId: string, count: number) => void
}

function CreatorRow({ match, isRetainer, currentUserId, initialPostsOpen, expandPostsTrigger, expandMsgsTrigger, hasUnreadMessages, onDeliverableVerified, onUnreadChange }: CreatorRowProps) {
  const [msgOpen, setMsgOpen]           = useState(false)
  const [postsOpen, setPostsOpen]       = useState(initialPostsOpen ?? false)
  const [unread, setUnread]             = useState(0)
  const [verifyingDid, setVerifyingDid] = useState<string | null>(null)
  const msgRef = useRef<HTMLDivElement>(null)

  const state       = deriveMatchState(match)
  const meta        = STATE_META[state] ?? STATE_META.in_progress
  const creator     = match.creator
  const handle      = creator?.instagram_handle
  const name        = creator?.display_name ?? 'Creator'
  const initials    = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const deliverables = match.deliverables ?? []
  const hasPosts    = deliverables.length > 0

  useEffect(() => {
    fetch(`/api/matches/${match.id}/messages/unread`)
      .then(r => r.json())
      .then(d => setUnread(d.count ?? 0))
      .catch(() => {})
  }, [match.id])

  useEffect(() => {
    if ((expandPostsTrigger ?? 0) > 0 && hasPosts) setPostsOpen(true)
  }, [expandPostsTrigger])

  useEffect(() => {
    if ((expandMsgsTrigger ?? 0) > 0 && hasUnreadMessages) {
      setMsgOpen(true)
      setUnread(0)
      onUnreadChange?.(match.id, 0)
      window.dispatchEvent(new Event('badges-refresh'))
    }
  }, [expandMsgsTrigger])

  async function verifyDeliverable(did: string) {
    setVerifyingDid(did)
    const res = await fetch(`/api/matches/${match.id}/deliverables/${did}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify' }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error ?? 'Failed to verify')
    } else {
      onDeliverableVerified(match.id, did)
      toast.success('Post verified')
    }
    setVerifyingDid(null)
  }

  useEffect(() => {
    if (msgOpen) setTimeout(() => msgRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
  }, [msgOpen])

  function toggleMsg() {
    setMsgOpen(o => !o)
    if (!msgOpen) {
      setUnread(0)
      onUnreadChange?.(match.id, 0)
      window.dispatchEvent(new Event('badges-refresh'))
    }
  }

  return (
    <div ref={msgRef}>
      <div className="flex items-center gap-3 px-4 py-3" style={{ borderTop: '1px solid rgba(0,0,0,0.06)', background: '#ffffff' }}>
        <Link href={`/business/creators/${creator?.id}`} className="flex items-center gap-3 flex-1 min-w-0 group">
          <div className="p-[2px] rounded-full flex-shrink-0" style={{ background: handle ? 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)' : 'rgba(0,0,0,0.1)' }}>
            {creator?.avatar_url ? (
              <img src={creator.avatar_url} alt={name} className="w-8 h-8 rounded-full object-cover block" style={{ border: '2px solid white' }} />
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #1C2B3A, #6BE6B0)', border: '2px solid white' }}>
                {initials}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm text-[#1C2B3A] truncate group-hover:underline underline-offset-2" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              {handle ? `@${handle}` : name}
            </p>
            {creator?.follower_count != null && (
              <p className="text-[10px] text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmt(creator.follower_count)} followers</p>
            )}
          </div>
        </Link>

        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0" style={{ background: meta.bg, color: meta.text, fontFamily: "'JetBrains Mono', monospace" }}>
          {meta.label}
        </span>

        {hasPosts && (
          <button
            onClick={() => setPostsOpen(o => !o)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all flex-shrink-0"
            style={{ background: postsOpen ? 'rgba(192,132,252,0.2)' : 'rgba(192,132,252,0.12)', color: '#9333ea', fontFamily: "'JetBrains Mono', monospace" }}
          >
            <ImageIcon className="w-3 h-3" />
            {deliverables.length > 0 ? deliverables.length : ''}
            <ChevronDown className="w-3 h-3 transition-transform duration-150" style={{ transform: postsOpen ? 'rotate(180deg)' : 'none' }} />
          </button>
        )}

        <button
          onClick={toggleMsg}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all flex-shrink-0"
          style={{
            background: msgOpen ? '#1C2B3A' : unread > 0 ? '#F5B800' : 'rgba(28,43,58,0.06)',
            color: msgOpen ? 'white' : unread > 0 ? '#1C2B3A' : '#6b7280',
          }}
        >
          <MessageCircle className="w-3 h-3" />
          {unread > 0 && !msgOpen ? unread : ''}
        </button>
      </div>

      {postsOpen && hasPosts && (
        <div className="px-4 py-3 flex flex-col gap-2" style={{ background: 'rgba(192,132,252,0.04)', borderTop: '1px solid rgba(192,132,252,0.1)' }}>
          {deliverables.map((d, idx) => (
            <div key={d.id} className="flex items-center gap-3 py-1">
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold" style={{ background: d.verified_at ? '#6BE6B0' : '#C084FC', color: '#1C2B3A' }}>
                {d.month_number ?? idx + 1}
              </div>
              <a href={d.post_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-blue-500 hover:underline flex-1 truncate">
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                {isRetainer ? `Month ${d.month_number}` : `Post ${idx + 1}`}
              </a>
              <span className="text-[10px] text-gray-400 flex-shrink-0" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {d.verified_at ? `verified ${fmtDate(d.verified_at)}` : fmtDate(d.created_at)}
              </span>
              {d.verified_at ? (
                <Check className="w-4 h-4 flex-shrink-0" style={{ color: '#22c55e' }} />
              ) : (
                <Button size="sm" loading={verifyingDid === d.id} onClick={() => verifyDeliverable(d.id)}>Verify</Button>
              )}
            </div>
          ))}
        </div>
      )}

      {msgOpen && (
        <div className="px-4 pb-4">
          <InlineMessageThread matchId={match.id} currentUserId={currentUserId} />
        </div>
      )}
    </div>
  )
}

interface Props {
  invite: Invite
  currentUserId: string
  initialOpen?: boolean
  initialOpenMatchId?: string
  onToggle: (id: string, active: boolean) => void
  onDelete: (id: string) => void
  onUpdated: (updated: Invite) => void
  onViewDetail?: (invite: Invite) => void
}

export function CollabCard({ invite, currentUserId, initialOpen, initialOpenMatchId, onToggle, onDelete, onUpdated, onViewDetail }: Props) {
  const [open, setOpen]               = useState(initialOpen ?? false)
  const [editing, setEditing]         = useState(false)
  const [toggling, setToggling]       = useState(false)
  const [deleting, setDeleting]       = useState(false)
  const [matches, setMatches]         = useState<MatchPreview[]>(invite.matches ?? [])
  const [unreadByMatch, setUnreadByMatch] = useState<Record<string, number>>({})
  const [postsTrigger, setPostsTrigger]   = useState(0)
  const [msgsTrigger, setMsgsTrigger]     = useState(0)
  const [menuOpen, setMenuOpen]           = useState(false)
  const menuRef                           = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [menuOpen])

  useEffect(() => { setMatches(invite.matches ?? []) }, [invite.matches])

  // Fetch unread message counts for all matches on mount so card badges show without expanding
  useEffect(() => {
    const ids = (invite.matches ?? []).map(m => m.id)
    ids.forEach(id => {
      fetch(`/api/matches/${id}/messages/unread`)
        .then(r => r.json())
        .then(d => setUnreadByMatch(prev => ({ ...prev, [id]: d.count ?? 0 })))
        .catch(() => {})
    })
  }, [])

  const isRetainer = invite.invite_type === 'retainer'
  const isFull     = invite.slots_claimed >= invite.slots_total
  const isActive   = invite.is_active

  const cardBorderStyle: React.CSSProperties = !isActive
    ? { background: '#ffffff', border: '1.5px solid #94a3b8' }
    : isRetainer
      ? { background: '#ffffff', border: '1.5px solid #60a5fa' }
      : {
          border: '1.5px solid transparent',
          background: 'linear-gradient(#ffffff, #ffffff) padding-box, linear-gradient(90deg, #833ab4, #fd1d1d, #fcb045) border-box',
        }

  async function handleToggle() {
    const closing = isActive
    if (closing && !confirm(`Close "${invite.title}"? It will no longer accept new creators.`)) return
    setToggling(true)
    const res = await fetch(`/api/invites/${invite.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !isActive }),
    })
    if (res.ok) {
      onToggle(invite.id, !isActive)
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

  function handleDeliverableVerified(matchId: string, deliverableId: string) {
    const updatedMatches = matches.map(m => m.id === matchId ? {
      ...m,
      deliverables: (m.deliverables ?? []).map(d => d.id === deliverableId ? { ...d, verified_at: new Date().toISOString() } : d),
    } : m)
    setMatches(updatedMatches)
    onUpdated({ ...invite, matches: updatedMatches })
    window.dispatchEvent(new Event('deliverable-verified'))
  }

  function handleUnreadChange(matchId: string, count: number) {
    setUnreadByMatch(prev => ({ ...prev, [matchId]: count }))
  }

  const totalUnread = Object.values(unreadByMatch).reduce((a, b) => a + b, 0)

  const sortedMatches = [...matches].sort((a, b) =>
    (STATE_ORDER[deriveMatchState(a)] ?? 4) - (STATE_ORDER[deriveMatchState(b)] ?? 4)
  )

  const verifyCount = matches.reduce((sum, m) => {
    if (m.closed_at) return sum
    return sum + (m.deliverables ?? []).filter(d => !d.verified_at).length
  }, 0)

  const closedCount = matches.filter(m => !!m.closed_at).length
  const value = isRetainer ? (invite.fee_gbp ?? 0) : invite.value_gbp

  return (
    <>
      {editing && <EditInviteModal invite={invite} onClose={() => setEditing(false)} onSaved={onUpdated} />}

      <div className="rounded-2xl flex flex-col" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', ...cardBorderStyle }}>

        {/* Card face — entire face is clickable to expand/collapse */}
        <div
          className="p-4 flex flex-col gap-3 flex-1"
          onClick={() => matches.length > 0 && setOpen(o => !o)}
          style={{ cursor: matches.length > 0 ? 'pointer' : 'default' }}
        >
          {/* Title row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-bold text-[#1C2B3A] leading-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '15px' }}>
                  {invite.title}
                </p>
                {matches.length > 0 && (
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform duration-150 mt-0.5" style={{ transform: open ? 'rotate(180deg)' : 'none' }} />
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span
                  className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md"
                  style={{
                    background: isRetainer ? 'rgba(96,165,250,0.15)' : 'rgba(131,58,180,0.1)',
                    color: isRetainer ? '#1d4ed8' : '#833ab4',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {isRetainer ? 'Retainer' : 'One-off'}
                </span>
                {!isActive && (
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md" style={{ background: 'rgba(0,0,0,0.08)', color: '#6b7280', fontFamily: "'JetBrains Mono', monospace" }}>
                    Closed
                  </span>
                )}
                {isActive && isFull && (
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md" style={{ background: 'rgba(34,197,94,0.15)', color: '#15803d', fontFamily: "'JetBrains Mono', monospace" }}>
                    Full
                  </span>
                )}
                {isActive && !isFull && (
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md" style={{ background: 'rgba(245,184,0,0.18)', color: '#92400e', fontFamily: "'JetBrains Mono', monospace" }}>
                    Open
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-start gap-1.5 shrink-0">
              <div className="text-right">
                <p className="font-bold leading-tight" style={{ color: isRetainer ? '#1d4ed8' : '#833ab4', fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '16px' }}>
                  {formatGBP(value)}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {isRetainer ? '/mo' : 'value'}
                </p>
              </div>

              {/* Three-dot menu */}
              <div ref={menuRef} className="relative" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => setMenuOpen(o => !o)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-black/5 transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-36 rounded-xl bg-white z-50 overflow-hidden" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.12)', border: '1px solid rgba(0,0,0,0.08)' }}>
                    <button
                      onClick={() => { setMenuOpen(false); setEditing(true) }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      <Pencil className="w-3.5 h-3.5" />Edit
                    </button>
                    <button
                      onClick={() => { setMenuOpen(false); handleToggle() }}
                      disabled={toggling}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      {isActive ? <Lock className="w-3.5 h-3.5" /> : <LockOpen className="w-3.5 h-3.5" />}
                      {isActive ? 'Close' : 'Reopen'}
                    </button>
                    <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }} />
                    <button
                      onClick={() => { setMenuOpen(false); handleDelete() }}
                      disabled={deleting}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats + action row — fixed height so cards without badges stay the same size */}
          <div className="flex items-center gap-2 h-6">
            {matches.length > 0 && (
              <button
                onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold transition-colors shrink-0"
                style={{ background: open ? '#1C2B3A' : 'rgba(28,43,58,0.08)', color: open ? 'white' : '#1C2B3A' }}
              >
                <Users className="w-3 h-3" />
                {matches.length} creator{matches.length !== 1 ? 's' : ''}
                <ChevronDown className="w-3 h-3 transition-transform duration-150" style={{ transform: open ? 'rotate(180deg)' : 'none' }} />
              </button>
            )}
            {isRetainer && invite.posts_per_month != null && (
              <span className="text-xs text-gray-500 shrink-0" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {invite.posts_per_month}p/mo
              </span>
            )}
            {closedCount > 0 && (
              <span className="text-xs font-semibold shrink-0" style={{ color: '#16a34a', fontFamily: "'JetBrains Mono', monospace" }}>
                {closedCount} closed
              </span>
            )}
            {onViewDetail && (
              <button onClick={e => { e.stopPropagation(); onViewDetail(invite) }} title="View stats" className="shrink-0 hover:opacity-70 transition-opacity">
                <Info className="w-4 h-4" style={{ color: '#3b82f6' }} />
              </button>
            )}
            <div className="ml-auto flex items-center gap-1.5">
              {verifyCount > 0 && (
                <button
                  onClick={e => { e.stopPropagation(); if (open) { setOpen(false) } else { setOpen(true); setPostsTrigger(t => t + 1) } }}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold text-white hover:opacity-80 transition-opacity"
                  style={{ background: '#9333ea' }}
                  title={open ? 'Collapse' : 'Show posts to verify'}
                >
                  <ImageIcon className="w-3 h-3" />
                  {verifyCount}
                </button>
              )}
              {totalUnread > 0 && (
                <button
                  onClick={e => { e.stopPropagation(); if (open) { setOpen(false) } else { setOpen(true); setMsgsTrigger(t => t + 1) } }}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold hover:opacity-80 transition-opacity"
                  style={{ background: '#F5B800', color: '#1C2B3A' }}
                  title={open ? 'Collapse' : 'Show unread messages'}
                >
                  <MessageCircle className="w-3 h-3" />
                  {totalUnread}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Expandable creator rows */}
        {open && (
          <div className="rounded-b-2xl overflow-hidden" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
            {sortedMatches.map(m => (
              <CreatorRow
                key={m.id}
                match={m}
                isRetainer={isRetainer}
                currentUserId={currentUserId}
                initialPostsOpen={initialOpenMatchId === m.id}
                expandPostsTrigger={postsTrigger}
                expandMsgsTrigger={msgsTrigger}
                hasUnreadMessages={(unreadByMatch[m.id] ?? 0) > 0}
                onDeliverableVerified={handleDeliverableVerified}
                onUnreadChange={handleUnreadChange}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
