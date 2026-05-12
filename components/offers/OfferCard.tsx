'use client'
import { useState } from 'react'
import { MapPin, Clock, Users, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/Card'
import { CategoryBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatGBP, formatDate } from '@/lib/utils'
import type { Offer } from '@/lib/types'

interface Props {
  offer: Offer
  mode: 'browse' | 'manage'
  onClaimed?: (matchData: { id: string; punt_code: string }) => void
  onToggle?: (id: string, active: boolean) => void
  onDelete?: (id: string) => void
}

export function OfferCard({ offer, mode, onClaimed, onToggle, onDelete }: Props) {
  const [claiming, setClaiming] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const slotsLeft = offer.slots_total - offer.slots_claimed

  async function handleClaim() {
    setClaiming(true)
    const res = await fetch('/api/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offer_id: offer.id }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error ?? 'Could not claim offer')
    } else {
      onClaimed?.(data)
    }
    setClaiming(false)
  }

  async function handleDelete() {
    if (!confirm(`Delete "${offer.title}"? This can't be undone.`)) return
    setDeleting(true)
    const res = await fetch(`/api/offers/${offer.id}`, { method: 'DELETE' })
    if (res.ok) {
      onDelete?.(offer.id)
    } else {
      toast.error('Failed to delete offer')
      setDeleting(false)
    }
  }

  async function handleToggle() {
    setToggling(true)
    const res = await fetch(`/api/offers/${offer.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !offer.is_active }),
    })
    if (res.ok) {
      onToggle?.(offer.id, !offer.is_active)
    } else {
      toast.error('Failed to update offer')
    }
    setToggling(false)
  }

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[#1C2B3A] mb-1 leading-snug" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            {offer.title}
          </h3>
          {offer.business && (
            <div className="flex items-center gap-1 mb-2">
              <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
              <span className="text-xs text-gray-500 truncate">
                {offer.business.business_name ?? offer.business.display_name}
                {offer.business.address_line && ` · ${offer.business.address_line}`}
              </span>
            </div>
          )}
          <CategoryBadge category={offer.category} />
        </div>
        <div className="text-right shrink-0">
          <p className="font-bold text-lg" style={{ color: '#F5B800', fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            {formatGBP(offer.value_gbp)}
          </p>
          <p className="text-xs text-gray-400">value</p>
        </div>
      </div>

      <p className="text-sm text-gray-600 leading-relaxed">{offer.description}</p>

      {offer.requirements && (
        <div className="rounded-xl p-3" style={{ background: 'rgba(28,43,58,0.04)' }}>
          <p className="text-xs font-semibold text-[#1C2B3A] mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>REQUIREMENTS</p>
          <p className="text-xs text-gray-600">{offer.requirements}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-1 border-t border-black/5">
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {slotsLeft} slot{slotsLeft !== 1 ? 's' : ''} left
          </span>
          {offer.expires_at && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Expires {formatDate(offer.expires_at)}
            </span>
          )}
        </div>

        {mode === 'browse' && (
          <Button size="sm" onClick={handleClaim} loading={claiming} disabled={slotsLeft === 0}>
            {slotsLeft === 0 ? 'Full' : 'Claim offer'}
          </Button>
        )}

        {mode === 'manage' && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={offer.is_active ? 'ghost' : 'secondary'}
              loading={toggling}
              onClick={handleToggle}
            >
              {offer.is_active ? 'Pause' : 'Activate'}
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
