'use client'
import { useState } from 'react'
import { ChevronDown, ExternalLink, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { MatchMessages } from '@/components/matches/MatchMessages'
import { formatDate } from '@/lib/utils'
import type { Match, MatchDeliverable } from '@/lib/types'

const STATUS: Record<string, { border: string; bg: string; text: string; label: string }> = {
  pending:   { border: '#F5B800', bg: 'rgba(245,184,0,0.1)',    text: '#b45309', label: 'Pending' },
  visited:   { border: '#818cf8', bg: 'rgba(99,102,241,0.08)',  text: '#4f46e5', label: 'Visited' },
  posted:    { border: '#C084FC', bg: 'rgba(192,132,252,0.08)', text: '#9333ea', label: 'Posted' },
  verified:  { border: '#22c55e', bg: 'rgba(34,197,94,0.08)',   text: '#16a34a', label: 'Verified' },
  active:    { border: '#6BE6B0', bg: 'rgba(107,230,176,0.08)', text: '#059669', label: 'Active' },
  completed: { border: '#94a3b8', bg: 'rgba(148,163,184,0.08)', text: '#64748b', label: 'Complete' },
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
  if (days < 14) return `${days} days ago`
  return formatDate(iso)
}

function needsAction(match: Match) {
  const isRetainer = match.invite?.invite_type === 'retainer'
  if (!isRetainer && match.status === 'posted') return true
  if (isRetainer && match.status === 'pending') return true
  if (isRetainer && match.status === 'active' && (match.deliverables ?? []).some(d => d.status !== 'verified')) return true
  return false
}

interface Props {
  match: Match
  currentUserId: string
  onUpdated: (updated: Match) => void
}

export function BusinessMatchCard({ match, currentUserId, onUpdated }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deliverableLoading, setDeliverableLoading] = useState<string | null>(null)

  const isRetainer = match.invite?.invite_type === 'retainer'
  const stepIdx = STEPS.indexOf(match.status as typeof STEPS[number])
  const colours = STATUS[match.status] ?? STATUS.pending
  const actionNeeded = needsAction(match)

  const creator = match.creator
  const handle = creator?.instagram_handle
  const name = creator?.display_name ?? 'Unknown creator'
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

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
      className="bg-white rounded-2xl overflow-hidden flex flex-col transition-shadow hover:shadow-md"
      style={{
        border: `1.5px solid ${actionNeeded ? colours.border : 'rgba(0,0,0,0.07)'}`,
        boxShadow: actionNeeded ? `0 0 0 1px ${colours.border}20` : '0 1px 6px rgba(0,0,0,0.04)',
      }}
    >
      {/* Status strip */}
      <div style={{ height: '3px', background: colours.border }} />

      {/* Clickable summary */}
      <button
        className="w-full flex items-start gap-3 px-4 pt-4 pb-3.5 text-left hover:bg-gray-50/50 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Avatar */}
        <div className="shrink-0 mt-0.5">
          <div
            className="p-[2px] rounded-full"
            style={{ background: handle ? 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)' : 'rgba(0,0,0,0.08)' }}
          >
            {creator?.avatar_url ? (
              <img src={creator.avatar_url} alt={name} className="w-10 h-10 rounded-full object-cover block" style={{ border: '2px solid white' }} />
            ) : (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #1C2B3A, #6BE6B0)', border: '2px solid white' }}
              >
                {initials}
              </div>
            )}
          </div>
        </div>

        {/* Info block */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-bold text-sm text-[#1C2B3A] leading-snug truncate" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                {handle ? `@${handle}` : name}
              </p>
              {handle && <p className="text-[11px] text-gray-400 truncate">{name}</p>}
              {creator?.follower_count != null && (
                <p className="text-[10px] text-gray-400 mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {fmt(creator.follower_count)} followers
                </p>
              )}
            </div>
            <span
              className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-lg"
              style={{ background: colours.bg, color: colours.text, fontFamily: "'JetBrains Mono', monospace" }}
            >
              {actionNeeded && (
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: colours.text }} />
              )}
              {colours.label}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 mt-2">
            <p className="text-[11px] text-gray-500 truncate">{match.invite?.title ?? 'Collab'}</p>
            <span className="text-[10px] font-bold tracking-widest text-gray-300 shrink-0" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {match.punt_code}
            </span>
          </div>

          <div className="flex items-center justify-between mt-1.5">
            <p className="text-[10px] text-gray-400">Claimed {timeAgo(match.created_at)}</p>
            <ChevronDown
              className="w-3.5 h-3.5 text-gray-300 transition-transform duration-200"
              style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
            />
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-black/05 px-4 py-4 flex flex-col gap-4">

          {/* One-off: progress stepper */}
          {!isRetainer && (
            <div className="flex items-center">
              {STEPS.map((step, i) => {
                const done = i < stepIdx
                const active = i === stepIdx
                return (
                  <div key={step} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                        style={{
                          background: done ? '#6BE6B0' : active ? '#F5B800' : 'rgba(0,0,0,0.08)',
                          color: done || active ? '#1C2B3A' : '#9ca3af',
                        }}
                      >
                        {done ? <Check className="w-3 h-3" /> : i + 1}
                      </div>
                      <p className="text-[9px] mt-1 capitalize" style={{ color: active ? '#1C2B3A' : '#9ca3af', fontFamily: "'JetBrains Mono', monospace" }}>
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

          {/* One-off: post link + verify */}
          {!isRetainer && match.post_url && (
            <a href={match.post_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-blue-500 hover:underline">
              <ExternalLink className="w-3.5 h-3.5" />
              View submitted post
            </a>
          )}
          {!isRetainer && match.status === 'posted' && (
            <Button size="sm" onClick={() => updateStatus('verified')} loading={loading}>Verify post</Button>
          )}
          {!isRetainer && match.status === 'verified' && (
            <p className="text-xs font-semibold" style={{ color: '#22c55e', fontFamily: "'JetBrains Mono', monospace" }}>✓ Complete</p>
          )}

          {/* Retainer: activate */}
          {isRetainer && match.status === 'pending' && (
            <div className="flex flex-col gap-1">
              <Button size="sm" onClick={() => updateStatus('active')} loading={loading}>Activate arrangement</Button>
              <p className="text-xs text-gray-400">Confirm you want to work with this creator.</p>
            </div>
          )}

          {/* Retainer: deliverables */}
          {isRetainer && match.status !== 'pending' && (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Monthly deliverables</p>
              {(match.deliverables ?? []).length === 0 ? (
                <p className="text-xs text-gray-400 italic">No posts submitted yet.</p>
              ) : (
                (match.deliverables ?? []).sort((a, b) => a.month_number - b.month_number).map((d: MatchDeliverable) => (
                  <div key={d.id} className="flex items-center gap-2 rounded-xl px-3 py-2" style={{
                    background: d.status === 'verified' ? 'rgba(107,230,176,0.08)' : 'rgba(0,0,0,0.03)',
                    border: `1px solid ${d.status === 'verified' ? 'rgba(107,230,176,0.25)' : 'rgba(0,0,0,0.07)'}`,
                  }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold" style={{ background: d.status === 'verified' ? '#6BE6B0' : '#F5B800', color: '#1C2B3A' }}>
                      {d.month_number}
                    </div>
                    <a href={d.post_url} target="_blank" rel="noopener noreferrer" className="flex-1 text-xs text-blue-500 hover:underline truncate">
                      Month {d.month_number} post
                    </a>
                    {d.status === 'verified' ? (
                      <span className="text-xs font-semibold" style={{ color: '#22c55e' }}>✓</span>
                    ) : (
                      <Button size="sm" loading={deliverableLoading === d.id} onClick={() => verifyDeliverable(d.id, d.month_number)}>Verify</Button>
                    )}
                  </div>
                ))
              )}
              {match.status === 'active' && (
                <button onClick={() => updateStatus('completed')} className="text-xs text-gray-400 hover:text-gray-600 text-left mt-1">
                  End arrangement
                </button>
              )}
              {match.status === 'completed' && (
                <p className="text-xs font-semibold" style={{ color: '#22c55e', fontFamily: "'JetBrains Mono', monospace" }}>✓ Arrangement complete</p>
              )}
            </div>
          )}

          {/* Messages */}
          <MatchMessages matchId={match.id} currentUserId={currentUserId} />
        </div>
      )}
    </div>
  )
}
