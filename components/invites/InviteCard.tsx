'use client'
import { useState } from 'react'
import { MapPin, Clock, Users, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/Card'
import { CategoryBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatGBP, formatDate } from '@/lib/utils'
import type { Invite } from '@/lib/types'

interface Props {
  invite: Invite
  mode: 'browse' | 'manage'
  isApproved?: boolean
  onClaimed?: (matchData: { id: string; punt_code: string }) => void
  onToggle?: (id: string, active: boolean) => void
  onDelete?: (id: string) => void
}

export function InviteCard({ invite, mode, isApproved = true, onClaimed, onToggle, onDelete }: Props) {
  const [claiming, setClaiming] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const slotsLeft = invite.slots_total - invite.slots_claimed

  async function handleClaim() {
    setClaiming(true)
    const res = await fetch('/api/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offer_id: invite.id }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error ?? 'Could not claim invite')
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
      toast.error('Failed to delete invite')
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
      toast.error('Failed to update invite')
    }
    setToggling(false)
  }

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[#1C2B3A] mb-1 leading-snug" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            {invite.title}
          </h3>
          {invite.business && (
            <div className="flex items-center gap-1 mb-2">
              <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
              {invite.business.latitude && invite.business.longitude ? (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${invite.business.latitude},${invite.business.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline truncate"
                  onClick={e => e.stopPropagation()}
                >
                  {invite.business.business_name ?? invite.business.display_name}
                  {invite.business.address_line && ` · ${invite.business.address_line}`}
                </a>
              ) : (
                <span className="text-xs text-gray-500 truncate">
                  {invite.business.business_name ?? invite.business.display_name}
                  {invite.business.address_line && ` · ${invite.business.address_line}`}
                </span>
              )}
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <CategoryBadge category={invite.category} />
            {invite.invite_type === 'retainer' && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide" style={{ background: 'rgba(107,230,176,0.15)', color: '#059669' }}>
                Retainer
              </span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          {invite.invite_type === 'retainer' ? (
            <>
              <p className="font-bold text-lg" style={{ color: '#6BE6B0', fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                {formatGBP(invite.fee_gbp ?? 0)}
              </p>
              <p className="text-xs text-gray-400">per month</p>
            </>
          ) : (
            <>
              <p className="font-bold text-lg" style={{ color: '#F5B800', fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                {formatGBP(invite.value_gbp)}
              </p>
              <p className="text-xs text-gray-400">value</p>
            </>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-600 leading-relaxed">{invite.description}</p>

      {invite.invite_type === 'retainer' && (
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

      <div className="flex items-center justify-between pt-1 border-t border-black/5">
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
          <Button size="sm" onClick={handleClaim} loading={claiming} disabled={slotsLeft === 0 || !isApproved}>
            {slotsLeft === 0 ? 'Full' : 'Claim invite'}
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
    </Card>
  )
}
