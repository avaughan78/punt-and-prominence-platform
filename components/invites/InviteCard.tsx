'use client'
import { useState } from 'react'
import { MapPin, Clock, Users, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { CategoryBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatGBP, formatDate } from '@/lib/utils'
import type { Invite } from '@/lib/types'

interface Props {
  invite: Invite
  mode: 'browse' | 'manage'
  isApproved?: boolean
  isProfileComplete?: boolean
  alreadyClaimed?: boolean
  onClaimed?: (matchData: { id: string; punt_code: string }) => void
  onToggle?: (id: string, active: boolean) => void
  onDelete?: (id: string) => void
}

export function InviteCard({ invite, mode, isApproved = true, isProfileComplete = true, alreadyClaimed = false, onClaimed, onToggle, onDelete }: Props) {
  const [claiming, setClaiming] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const slotsLeft = invite.slots_total - invite.slots_claimed
  const biz = invite.business
  const bizName = biz?.business_name ?? biz?.display_name ?? ''
  const initials = bizName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
  const isRetainer = invite.invite_type === 'retainer'

  async function handleClaim() {
    setClaiming(true)
    const res = await fetch('/api/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offer_id: invite.id }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error ?? 'Could not claim collab')
    } else {
      onClaimed?.(data)
    }
    setClaiming(false)
  }

  async function handleDelete() {
    if (!confirm(`Delete "${invite.title}"? This can't be undone.`)) return
    setDeleting(true)
    const res = await fetch(`/api/invites/${invite.id}`, { method: 'DELETE' })
    if (res.ok) {
      onDelete?.(invite.id)
    } else {
      toast.error('Failed to delete collab')
      setDeleting(false)
    }
  }

  async function handleToggle() {
    setToggling(true)
    const res = await fetch(`/api/invites/${invite.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !invite.is_active }),
    })
    if (res.ok) {
      onToggle?.(invite.id, !invite.is_active)
    } else {
      toast.error('Failed to update collab')
    }
    setToggling(false)
  }

  const cardBorderStyle: React.CSSProperties = isRetainer
    ? { background: '#ffffff', border: '1.5px solid #60a5fa' }
    : { border: '1.5px solid transparent', background: 'linear-gradient(#ffffff, #ffffff) padding-box, linear-gradient(90deg, #833ab4, #fd1d1d, #fcb045) border-box' }

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', ...cardBorderStyle }}
    >
      {/* ── Header band ── */}
      <div className="relative shrink-0" style={{ height: '72px' }}>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(131,58,180,0.07) 0%, rgba(253,29,29,0.06) 60%, rgba(252,176,69,0.04) 100%)' }} />

        {/* Title — right-justified in the band */}
        <div className="absolute inset-0 flex items-center justify-end pl-20 pr-4">
          <h3
            className="font-bold text-sm leading-snug text-right line-clamp-2"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: '#1C2B3A' }}
          >
            {invite.title}
          </h3>
        </div>

        {/* Business avatar — overlaps band/body boundary */}
        <div className="absolute left-4" style={{ bottom: 0, transform: 'translateY(50%)' }}>
          <div
            className="p-[2.5px] rounded-full"
            style={{ background: biz?.instagram_handle ? 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)' : 'rgba(0,0,0,0.1)' }}
          >
            <div className="p-[2px] bg-white rounded-full">
              {biz?.avatar_url ? (
                <img src={biz.avatar_url} alt={bizName} className="w-12 h-12 rounded-full object-cover block" />
              ) : (
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #1C2B3A, #6BE6B0)' }}
                >
                  {initials}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-col gap-3 px-4 pt-9 pb-4 flex-1">

        {/* Business name + value */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-sm text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              {bizName}
            </p>
            {biz && (
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                {biz.latitude && biz.longitude ? (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${biz.latitude},${biz.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline truncate"
                    onClick={e => e.stopPropagation()}
                  >
                    {biz.address_line ?? bizName}
                  </a>
                ) : (
                  <span className="text-xs text-gray-400 truncate">{biz.address_line ?? ''}</span>
                )}
              </div>
            )}
          </div>

          {/* Value badge */}
          <div
            className="shrink-0 px-3 py-1.5 rounded-xl text-right"
            style={{
              background: isRetainer ? 'rgba(107,230,176,0.08)' : 'rgba(245,184,0,0.08)',
              border: `1px solid ${isRetainer ? 'rgba(107,230,176,0.25)' : 'rgba(245,184,0,0.25)'}`,
            }}
          >
            <p className="font-bold text-lg leading-none" style={{ color: isRetainer ? '#059669' : '#F5B800', fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              {formatGBP(isRetainer ? (invite.fee_gbp ?? 0) : invite.value_gbp)}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">{isRetainer ? '/month' : invite.compensation_type === 'paid' ? 'creator fee' : 'value'}</p>
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <CategoryBadge category={invite.category} />
          {isRetainer && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide" style={{ background: 'rgba(107,230,176,0.15)', color: '#059669' }}>
              Retainer
            </span>
          )}
          {invite.compensation_type === 'paid' ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide" style={{ background: 'rgba(245,184,0,0.15)', color: '#b45309' }}>
              Paid
            </span>
          ) : (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide" style={{ background: 'rgba(107,230,176,0.12)', color: '#059669' }}>
              Gifting
            </span>
          )}
          {!invite.is_active && mode === 'manage' && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide" style={{ background: 'rgba(0,0,0,0.06)', color: '#9ca3af' }}>
              Paused
            </span>
          )}
        </div>

        <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{invite.description}</p>

        {isRetainer && (
          <div className="flex items-center gap-4 text-xs rounded-xl px-3 py-2" style={{ background: 'rgba(107,230,176,0.08)', border: '1px solid rgba(107,230,176,0.2)' }}>
            <span className="text-gray-600"><span className="font-semibold text-[#1C2B3A]">{invite.posts_per_month}</span> post{invite.posts_per_month !== 1 ? 's' : ''}/month</span>
            {invite.duration_months
              ? <span className="text-gray-600"><span className="font-semibold text-[#1C2B3A]">{invite.duration_months}</span> month{invite.duration_months !== 1 ? 's' : ''}</span>
              : <span className="text-gray-600">Open-ended</span>
            }
          </div>
        )}

        {invite.requirements && (
          <div className="rounded-xl p-3" style={{ background: 'rgba(28,43,58,0.04)' }}>
            <p className="text-xs font-semibold text-[#1C2B3A] mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>REQUIREMENTS</p>
            <p className="text-xs text-gray-600">{invite.requirements}</p>
          </div>
        )}

        {/* Footer — pinned to bottom */}
        <div className="flex items-center justify-between pt-1 border-t border-black/5 mt-auto">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {slotsLeft} slot{slotsLeft !== 1 ? 's' : ''} left
            </span>
            {invite.expires_at && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Expires {formatDate(invite.expires_at)}
              </span>
            )}
          </div>

          {mode === 'browse' && (
            <Button size="sm" onClick={handleClaim} loading={claiming} disabled={slotsLeft === 0 || !isApproved || !isProfileComplete || alreadyClaimed}>
              {slotsLeft === 0 ? 'Full' : alreadyClaimed ? 'Already claimed' : 'Claim collab'}
            </Button>
          )}

          {mode === 'manage' && (
            <div className="flex items-center gap-2">
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
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                title="Delete offer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
