'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ExternalLink, Check, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { MatchMessages } from '@/components/matches/MatchMessages'
import { formatGBP, formatDate } from '@/lib/utils'
import type { Match, MatchDeliverable } from '@/lib/types'

const STATUS_META: Record<string, {
  border: string
  bg: string
  text: string
  contextual: (isRetainer: boolean) => string
}> = {
  pending:   { border: '#F5B800', bg: 'rgba(245,184,0,0.12)',    text: '#b45309', contextual: r => r ? 'Awaiting your activation' : 'Awaiting visit' },
  visited:   { border: '#818cf8', bg: 'rgba(99,102,241,0.1)',    text: '#4f46e5', contextual: () => 'Visited · awaiting post' },
  posted:    { border: '#C084FC', bg: 'rgba(192,132,252,0.12)',  text: '#9333ea', contextual: () => 'Post ready to verify' },
  verified:  { border: '#22c55e', bg: 'rgba(34,197,94,0.1)',     text: '#16a34a', contextual: () => 'Collab complete' },
  active:    { border: '#6BE6B0', bg: 'rgba(107,230,176,0.12)',  text: '#059669', contextual: () => 'Arrangement active' },
  completed: { border: '#94a3b8', bg: 'rgba(148,163,184,0.12)', text: '#64748b', contextual: () => 'Arrangement complete' },
}

const STEPS = ['pending', 'posted', 'verified'] as const

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
  return formatDate(iso)
}

interface Props {
  match: Match
  currentUserId: string
  onUpdated: (updated: Match) => void
}

export function BusinessMatchCard({ match, currentUserId, onUpdated }: Props) {
  const [detailOpen, setDetailOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deliverableLoading, setDeliverableLoading] = useState<string | null>(null)

  const isRetainer = match.invite?.invite_type === 'retainer'
  const meta = STATUS_META[match.status] ?? STATUS_META.pending
  const stepIdx = STEPS.indexOf(match.status as typeof STEPS[number])
  const isNew = Date.now() - new Date(match.created_at).getTime() < 48 * 3_600_000
  const isDone = match.status === 'verified' || match.status === 'completed'
  const isActionNeeded = (
    (!isRetainer && match.status === 'posted') ||
    (isRetainer && match.status === 'pending') ||
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
        display: 'flex',
        borderRadius: '20px',
        overflow: 'hidden',
        border: '1px solid rgba(0,0,0,0.08)',
        boxShadow: isActionNeeded
          ? `0 0 0 2px ${meta.border}35, 0 6px 28px rgba(0,0,0,0.1)`
          : '0 2px 16px rgba(0,0,0,0.07)',
        background: 'white',
      }}
    >
      {/* Left status accent — always visible, instant colour-coding */}
      <div style={{ width: '5px', flexShrink: 0, background: meta.border }} />

      {/* Card body */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>

        {/* ── Collab band ── */}
        <Link
          href="/business/invites"
          className="block hover:opacity-90 transition-opacity"
          style={{ background: 'linear-gradient(135deg, #1C2B3A 0%, #243d56 100%)', padding: '16px 20px 14px' }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
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
                className="font-bold text-white leading-snug"
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '15px' }}
              >
                {invite?.title ?? 'Collab'}
              </p>
              <p className="text-[10px] mt-1.5" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: "'Inter', sans-serif" }}>
                View collab →
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p
                className="font-bold leading-none"
                style={{
                  color: isRetainer ? '#6BE6B0' : '#F5B800',
                  fontFamily: "'Bricolage Grotesque', sans-serif",
                  fontSize: '20px',
                }}
              >
                {isRetainer ? formatGBP(invite?.fee_gbp ?? 0) : formatGBP(invite?.value_gbp ?? 0)}
              </p>
              <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono', monospace" }}>
                {isRetainer ? '/month' : 'value'}
              </p>
            </div>
          </div>
        </Link>

        {/* ── Creator identity ── */}
        <div className="px-5 py-5">
          <div className="flex items-start gap-4">
            {/* Avatar 56px */}
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
                    style={{ width: '56px', height: '56px', border: '2.5px solid white' }}
                  />
                ) : (
                  <div
                    className="rounded-full flex items-center justify-center font-bold text-white"
                    style={{
                      width: '56px',
                      height: '56px',
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

            {/* Identity */}
            <div className="flex-1 min-w-0">
              <p
                className="font-bold text-[#1C2B3A] leading-tight truncate"
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '17px' }}
              >
                {handle ? `@${handle}` : name}
              </p>
              {handle && (
                <p className="text-sm text-gray-500 mt-0.5 truncate">{name}</p>
              )}
              {creator?.follower_count != null && (
                <p className="text-xs text-gray-400 mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {fmt(creator.follower_count)} followers
                </p>
              )}

              {/* Contextual status line */}
              <div className="flex items-center gap-2 mt-3">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: meta.border }} />
                <p className="text-sm font-semibold" style={{ color: meta.text }}>
                  {meta.contextual(isRetainer)}
                </p>
                {isActionNeeded && (
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: meta.border }} />
                )}
              </div>
            </div>
          </div>

          {/* Punt code + date */}
          <div
            className="flex items-center justify-between mt-4 pt-4"
            style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}
          >
            <span
              className="text-xs font-bold tracking-widest"
              style={{ color: '#d1d5db', fontFamily: "'JetBrains Mono', monospace" }}
            >
              {match.punt_code}
            </span>
            <span className="text-xs text-gray-400">Claimed {timeAgo(match.created_at)}</span>
          </div>
        </div>

        {/* ── Quick actions on the card face ── */}
        {!isRetainer && match.status === 'posted' && (
          <div
            className="flex items-center gap-3 px-5 pb-5 -mt-1"
          >
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

        {isRetainer && match.status === 'pending' && (
          <div className="flex flex-col gap-1.5 px-5 pb-5 -mt-1">
            <Button onClick={() => updateStatus('active')} loading={loading}>
              Activate arrangement
            </Button>
            <p className="text-xs text-gray-400">Confirm you want to work with this creator.</p>
          </div>
        )}

        {isDone && (
          <div className="flex items-center gap-2 px-5 pb-5 -mt-1">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
              style={{ background: '#22c55e' }}
            >
              <Check className="w-3.5 h-3.5 text-white" />
            </div>
            <p className="text-sm font-semibold" style={{ color: '#16a34a', fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              {isRetainer ? 'Arrangement complete' : 'Collab verified and complete'}
            </p>
          </div>
        )}

        {/* ── Progress & detail toggle ── */}
        <button
          onClick={() => setDetailOpen(d => !d)}
          className="flex items-center justify-between w-full px-5 py-3 text-xs font-medium transition-colors hover:bg-gray-50"
          style={{ borderTop: '1px solid rgba(0,0,0,0.06)', color: detailOpen ? '#1C2B3A' : '#9ca3af' }}
        >
          <span>{detailOpen ? 'Hide details' : 'Progress & details'}</span>
          <ChevronDown
            className="w-3.5 h-3.5 transition-transform duration-200"
            style={{ transform: detailOpen ? 'rotate(180deg)' : 'none' }}
          />
        </button>

        {/* ── Detail section ── */}
        {detailOpen && (
          <div className="px-5 py-5 flex flex-col gap-4" style={{ background: '#f8f9fb', borderTop: '1px solid rgba(0,0,0,0.05)' }}>

            {/* Pending one-off: show collab context as reminder */}
            {!isRetainer && match.status === 'pending' && (invite?.description || invite?.requirements) && (
              <div
                className="rounded-2xl p-4 flex flex-col gap-3"
                style={{ background: 'white', border: '1px solid rgba(28,43,58,0.08)' }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  What's happening
                </p>
                {invite.description && (
                  <p className="text-sm text-gray-600 leading-relaxed">{invite.description}</p>
                )}
                {invite.requirements && (
                  <div className="pt-3" style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      Requirements
                    </p>
                    <p className="text-sm text-gray-600">{invite.requirements}</p>
                  </div>
                )}
              </div>
            )}

            {/* One-off: stepper (not pending) */}
            {!isRetainer && match.status !== 'pending' && (
              <div className="flex items-center">
                {STEPS.map((step, i) => {
                  const done = i < stepIdx
                  const active = i === stepIdx
                  return (
                    <div key={step} className="flex items-center flex-1">
                      <div className="flex flex-col items-center flex-1">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{
                            background: done ? '#6BE6B0' : active ? '#F5B800' : 'rgba(0,0,0,0.08)',
                            color: done || active ? '#1C2B3A' : '#9ca3af',
                          }}
                        >
                          {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
                        </div>
                        <p
                          className="text-[9px] mt-1.5 capitalize font-semibold"
                          style={{ color: active ? '#1C2B3A' : '#9ca3af', fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          {step}
                        </p>
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className="h-0.5 flex-1 -mt-4" style={{ background: done ? '#6BE6B0' : 'rgba(0,0,0,0.08)' }} />
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Retainer: deliverables */}
            {isRetainer && match.status !== 'pending' && (
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  Monthly deliverables
                </p>
                {(match.deliverables ?? []).length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No posts submitted yet.</p>
                ) : (
                  (match.deliverables ?? []).sort((a, b) => a.month_number - b.month_number).map((d: MatchDeliverable) => (
                    <div
                      key={d.id}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                      style={{
                        background: d.status === 'verified' ? 'rgba(107,230,176,0.08)' : 'white',
                        border: `1px solid ${d.status === 'verified' ? 'rgba(107,230,176,0.25)' : 'rgba(0,0,0,0.07)'}`,
                      }}
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                        style={{ background: d.status === 'verified' ? '#6BE6B0' : '#F5B800', color: '#1C2B3A' }}
                      >
                        {d.month_number}
                      </div>
                      <a
                        href={d.post_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-sm text-blue-500 hover:underline truncate"
                      >
                        Month {d.month_number} post
                      </a>
                      {d.status === 'verified' ? (
                        <span className="text-sm font-bold" style={{ color: '#22c55e' }}>✓</span>
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
          </div>
        )}

        {/* ── Messages — always on the card, not hidden behind expand ── */}
        <div className="px-5 py-4" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <MatchMessages matchId={match.id} currentUserId={currentUserId} />
        </div>

      </div>
    </div>
  )
}
