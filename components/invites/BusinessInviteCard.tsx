'use client'
import { useState } from 'react'
import { ChevronDown, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { EditInviteModal } from '@/components/invites/EditInviteModal'
import { formatGBP } from '@/lib/utils'
import type { Invite } from '@/lib/types'

interface Props {
  invite: Invite
  onToggle: (id: string, active: boolean) => void
  onDelete: (id: string) => void
  onUpdated: (updated: Invite) => void
}

function SlotDots({ total, claimed }: { total: number; claimed: number }) {
  if (total > 8) {
    return (
      <span className="text-[10px] font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace", color: claimed >= total ? '#22c55e' : '#F5B800' }}>
        {claimed}/{total} claimed
      </span>
    )
  }
  return (
    <div className="flex gap-1">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full"
          style={{ background: i < claimed ? '#6BE6B0' : 'rgba(0,0,0,0.12)' }}
        />
      ))}
    </div>
  )
}

export function BusinessInviteCard({ invite, onToggle, onDelete, onUpdated }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useState(false)

  const isRetainer = invite.invite_type === 'retainer'
  const isFull = invite.slots_claimed >= invite.slots_total
  const isActive = invite.is_active

  const stripColor = !isActive ? '#94a3b8' : isFull ? '#22c55e' : '#F5B800'

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
      toast.error('Failed to update collab')
    }
    setToggling(false)
  }

  async function handleDelete() {
    if (!confirm(`Delete "${invite.title}"? This can't be undone.`)) return
    setDeleting(true)
    const res = await fetch(`/api/invites/${invite.id}`, { method: 'DELETE' })
    if (res.ok) {
      onDelete(invite.id)
    } else {
      toast.error('Failed to delete collab')
      setDeleting(false)
    }
  }

  return (
    <>
      {editing && (
        <EditInviteModal
          invite={invite}
          onClose={() => setEditing(false)}
          onSaved={onUpdated}
        />
      )}

      <div
        className="bg-white rounded-2xl overflow-hidden flex flex-col transition-shadow hover:shadow-md"
        style={{ border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}
      >
        {/* Status strip */}
        <div style={{ height: '3px', background: stripColor }} />

        {/* Clickable summary */}
        <button
          className="w-full px-4 pt-4 pb-3.5 text-left hover:bg-gray-50/50 transition-colors"
          onClick={() => setExpanded(e => !e)}
        >
          {/* Top row: title + value */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm text-[#1C2B3A] leading-snug" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                {invite.title}
              </p>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span
                  className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md"
                  style={{
                    background: isRetainer ? 'rgba(107,230,176,0.15)' : 'rgba(245,184,0,0.12)',
                    color: isRetainer ? '#059669' : '#b45309',
                  }}
                >
                  {isRetainer ? 'Retainer' : 'One-off'}
                </span>
                {!isActive && (
                  <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(0,0,0,0.06)', color: '#9ca3af' }}>
                    Paused
                  </span>
                )}
                {isFull && isActive && (
                  <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(34,197,94,0.1)', color: '#16a34a' }}>
                    Full
                  </span>
                )}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-bold text-base leading-none" style={{ color: isRetainer ? '#059669' : '#F5B800', fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                {isRetainer ? formatGBP(invite.fee_gbp ?? 0) : formatGBP(invite.value_gbp)}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">{isRetainer ? '/month' : 'value'}</p>
            </div>
          </div>

          {/* Slot progress */}
          <div className="flex items-center justify-between mt-2">
            {isRetainer ? (
              <span className="text-[10px] text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {invite.posts_per_month} post{invite.posts_per_month !== 1 ? 's' : ''}/month
              </span>
            ) : (
              <SlotDots total={invite.slots_total} claimed={invite.slots_claimed} />
            )}
            <ChevronDown
              className="w-3.5 h-3.5 text-gray-300 transition-transform duration-200"
              style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
            />
          </div>
        </button>

        {/* Expanded detail */}
        {expanded && (
          <div className="border-t border-black/05 px-4 py-4 flex flex-col gap-3">
            {invite.description && (
              <p className="text-xs text-gray-600 leading-relaxed">{invite.description}</p>
            )}

            {invite.requirements && (
              <div className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(28,43,58,0.04)' }}>
                <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Requirements</p>
                <p className="text-xs text-gray-600">{invite.requirements}</p>
              </div>
            )}

            {isRetainer && (invite.duration_months || invite.posts_per_month) && (
              <div className="flex items-center gap-3 text-xs rounded-xl px-3 py-2" style={{ background: 'rgba(107,230,176,0.08)', border: '1px solid rgba(107,230,176,0.2)' }}>
                <span className="text-gray-600"><span className="font-semibold text-[#1C2B3A]">{invite.posts_per_month}</span> post{invite.posts_per_month !== 1 ? 's' : ''}/month</span>
                {invite.duration_months
                  ? <span className="text-gray-600"><span className="font-semibold text-[#1C2B3A]">{invite.duration_months}</span> months</span>
                  : <span className="text-gray-500">Open-ended</span>
                }
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center gap-2 pt-1 border-t border-black/05">
              <Button
                size="sm"
                variant={isActive ? 'ghost' : 'secondary'}
                loading={toggling}
                onClick={handleToggle}
              >
                {isActive ? 'Pause' : 'Activate'}
              </Button>
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-[#1C2B3A] hover:bg-gray-100 transition-colors"
              >
                <Pencil className="w-3 h-3" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="ml-auto p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
