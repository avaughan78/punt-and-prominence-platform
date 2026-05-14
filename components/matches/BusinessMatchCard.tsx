'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ExternalLink, Check, Sparkles, MessageCircle, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { MatchMessages } from '@/components/matches/MatchMessages'
import { formatGBP } from '@/lib/utils'
import type { Match, MatchDeliverable } from '@/lib/types'

const STATUS_META: Record<string, {
  border: string
  bg: string
  text: string
  contextual: (isRetainer: boolean) => string
}> = {
  accepted:  { border: '#F5B800', bg: 'rgba(245,184,0,0.12)',    text: '#b45309', contextual: r => r ? 'Awaiting your activation' : 'Awaiting post' },
  posted:    { border: '#C084FC', bg: 'rgba(192,132,252,0.12)',  text: '#9333ea', contextual: () => 'Post ready to verify' },
  verified:  { border: '#22c55e', bg: 'rgba(34,197,94,0.1)',     text: '#16a34a', contextual: () => 'Collab complete' },
  active:    { border: '#6BE6B0', bg: 'rgba(107,230,176,0.12)',  text: '#059669', contextual: () => 'Arrangement active' },
  completed: { border: '#94a3b8', bg: 'rgba(148,163,184,0.12)', text: '#64748b', contextual: () => 'Arrangement complete' },
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

interface Props {
  match: Match
  currentUserId: string
  onUpdated: (updated: Match) => void
}

export function BusinessMatchCard({ match, currentUserId, onUpdated }: Props) {
  const [messagesOpen, setMessagesOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deliverableLoading, setDeliverableLoading] = useState<string | null>(null)

  const isRetainer = match.invite?.invite_type === 'retainer'
  const meta = STATUS_META[match.status] ?? STATUS_META.accepted
  const isNew = Date.now() - new Date(match.created_at).getTime() < 48 * 3_600_000
  const isDone = match.status === 'verified' || match.status === 'completed'
  const isActionNeeded = (
    (!isRetainer && match.status === 'posted') ||
    (isRetainer && match.status === 'accepted') ||
    (isRetainer && match.status === 'active' && (match.deliverables ?? []).some(d => d.status !== 'verified'))
  )

  const creator = match.creator
  const handle = creator?.instagram_handle
  const name = creator?.display_name ?? 'Creator'
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const invite = match.invite

  async function updateStatus(status: string) {
    setLoading(true)
    const res = await fetch(`/api/matches/${match.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    const data = await res.json()
    if (!res.ok) toast.error(data.error ?? 'Failed to update')
    else { toast.success('Match updated'); onUpdated(data) }
    setLoading(false)
  }

  async function verifyDeliverable(did: string, month: number) {
    setDeliverableLoading(did)
    const res = await fetch(`/api/matches/${match.id}/deliverables/${did}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await res.json()
    if (!res.ok) toast.error(data.error ?? 'Failed to verify')
    else {
      toast.success(`Month ${month} verified`)
      onUpdated({ ...match, deliverables: (match.deliverables ?? []).map(d => d.id === did ? data : d) })
    }
    setDeliverableLoading(null)
  }

  return (
    <div
      style={{
        borderRadius: '20px',
        overflow: 'hidden',
        border: '1px solid rgba(0,0,0,0.08)',
        boxShadow: isActionNeeded
          ? `0 0 0 2px ${meta.border}35, 0 6px 28px rgba(0,0,0,0.1)`
          : '0 2px 16px rgba(0,0,0,0.07)',
        background: 'white',
      }}
    >
      {/* Top status accent */}
      <div style={{ height: '5px', background: meta.border }} />

      {/* Card body */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>

        {/* ── Collab band ── */}
        <Link
          href="/business/invites"
          className="block hover:opacity-90 transition-opacity"
          style={{ background: 'linear-gradient(135deg, #1C2B3A 0%, #243d56 100%)', padding: '14px 20px 12px' }}
        >
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span
                  className="text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md"
                  style={{
                    background: isRetainer ? 'rgba(107,230,176,0.2)' : 'rgba(245,184,0,0.2)',
                    color: isRetainer ? '#6BE6B0' : '#F5B800',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {isRetainer ? 'Retainer' : 'One-off'}
                </span>
                {isNew && (
                  <span
                    className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md"
                    style={{ background: 'rgba(245,184,0,0.25)', color: '#F5B800', fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    <Sparkles className="w-2.5 h-2.5" />
                    New
                  </span>
                )}
              </div>
              <p
                className="font-bold text-white leading-snug truncate"
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '15px' }}
              >
                {invite?.title ?? 'Collab'}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p
                className="font-bold leading-none"
                style={{ color: isRetainer ? '#6BE6B0' : '#F5B800', fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '18px' }}
              >
                {isRetainer ? formatGBP(invite?.fee_gbp ?? 0) : formatGBP(invite?.value_gbp ?? 0)}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono', monospace" }}>
                {isRetainer ? '/month' : 'value'}
              </p>
            </div>
          </div>
        </Link>

        {/* ── Creator identity ── */}
        <div className="px-5 py-4">
          <div className="flex items-center gap-4">
            <div className="shrink-0">
              <div
                className="p-[2.5px] rounded-full"
                style={{ background: handle ? 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)' : 'rgba(0,0,0,0.1)' }}
              >
                {creator?.avatar_url ? (
                  <img
                    src={creator.avatar_url}
                    alt={name}
                    className="rounded-full object-cover block"
                    style={{ width: '52px', height: '52px', border: '2.5px solid white' }}
                  />
                ) : (
                  <div
                    className="rounded-full flex items-center justify-center font-bold text-white"
                    style={{
                      width: '52px',
                      height: '52px',
                      background: 'linear-gradient(135deg, #1C2B3A, #6BE6B0)',
                      border: '2.5px solid white',
                      fontFamily: "'Bricolage Grotesque', sans-serif",
                      fontSize: '16px',
                    }}
                  >
                    {initials}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <p
                className="font-bold text-[#1C2B3A] leading-tight truncate"
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '16px' }}
              >
                {handle ? `@${handle}` : name}
              </p>
              {handle && (
                <p className="text-sm text-gray-400 mt-0.5 truncate">{name}</p>
              )}
              {creator?.follower_count != null && (
                <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {fmt(creator.follower_count)} followers
                </p>
              )}
            </div>

            <div className="shrink-0 flex flex-col items-end gap-1.5">
              <span
                className="text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
                style={{ background: meta.bg, color: meta.text, fontFamily: "'JetBrains Mono', monospace" }}
              >
                {meta.contextual(isRetainer)}
              </span>
              {isActionNeeded && (
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: meta.border }} />
              )}
            </div>
          </div>
        </div>

        {/* ── Quick actions ── */}
        {!isRetainer && match.status === 'posted' && (
          <div className="flex items-center gap-3 px-5 pb-4">
            {match.post_url && (
              <a
                href={match.post_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm font-semibold hover:underline"
                style={{ color: '#3b82f6' }}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View post
              </a>
            )}
            <Button onClick={() => updateStatus('verified')} loading={loading}>
              Verify post
            </Button>
          </div>
        )}

        {isRetainer && match.status === 'accepted' && (
          <div className="flex flex-col gap-1.5 px-5 pb-4">
            <Button onClick={() => updateStatus('active')} loading={loading}>
              Activate arrangement
            </Button>
            <p className="text-xs text-gray-400">Confirm you want to work with this creator.</p>
          </div>
        )}

        {isDone && (
          <div className="flex items-center gap-2 px-5 pb-4">
            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: '#22c55e' }}>
              <Check className="w-3.5 h-3.5 text-white" />
            </div>
            <p className="text-sm font-semibold" style={{ color: '#16a34a', fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              {isRetainer ? 'Arrangement complete' : 'Collab verified and complete'}
            </p>
          </div>
        )}

        {/* Retainer deliverables — always visible */}
        {isRetainer && match.status !== 'accepted' && (
          <div className="px-5 pb-4 flex flex-col gap-2">
            {(match.deliverables ?? []).length === 0 ? (
              <p className="text-sm text-gray-400 italic">No posts submitted yet.</p>
            ) : (
              [...(match.deliverables ?? [])].sort((a, b) => a.month_number - b.month_number).map((d: MatchDeliverable) => (
                <div
                  key={d.id}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                  style={{
                    background: d.status === 'verified' ? 'rgba(107,230,176,0.08)' : 'rgba(0,0,0,0.02)',
                    border: `1px solid ${d.status === 'verified' ? 'rgba(107,230,176,0.25)' : 'rgba(0,0,0,0.07)'}`,
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                    style={{ background: d.status === 'verified' ? '#6BE6B0' : '#F5B800', color: '#1C2B3A' }}
                  >
                    {d.month_number}
                  </div>
                  <a href={d.post_url} target="_blank" rel="noopener noreferrer" className="flex-1 text-sm text-blue-500 hover:underline truncate">
                    Month {d.month_number} post
                  </a>
                  {d.status === 'verified' ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Button size="sm" loading={deliverableLoading === d.id} onClick={() => verifyDeliverable(d.id, d.month_number)}>
                      Verify
                    </Button>
                  )}
                </div>
              ))
            )}
            {match.status === 'active' && (
              <button
                onClick={() => updateStatus('completed')}
                className="text-xs text-gray-400 hover:text-gray-600 text-left mt-1 transition-colors"
              >
                End arrangement
              </button>
            )}
          </div>
        )}

        {/* ── Footer: Messages toggle ── */}
        <div
          className="flex items-center mt-auto px-5 py-3"
          style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}
        >
          <button
            onClick={() => setMessagesOpen(o => !o)}
            className="flex items-center gap-2 text-sm font-semibold transition-all rounded-lg px-3 py-1.5"
            style={{
              color: messagesOpen ? '#1C2B3A' : '#9ca3af',
              background: messagesOpen ? 'rgba(28,43,58,0.06)' : 'transparent',
            }}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Messages
          </button>
        </div>

        {/* ── Inline messages ── */}
        {messagesOpen && (
          <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
            <div
              className="flex items-center justify-between px-5 py-3 shrink-0"
              style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}
            >
              <p className="text-sm font-semibold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                Messages
              </p>
              <button
                onClick={() => setMessagesOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <MatchMessages matchId={match.id} currentUserId={currentUserId} />
          </div>
        )}
      </div>
    </div>
  )
}
