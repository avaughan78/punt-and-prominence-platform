'use client'
import { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { REQUIREMENT_CHIPS, applyChip } from '@/lib/requirementChips'
import type { Invite } from '@/lib/types'

interface Props {
  invite: Invite
  onClose: () => void
  onSaved: (updated: Invite) => void
}

export function EditInviteModal({ invite, onClose, onSaved }: Props) {
  const isRetainer = invite.invite_type === 'retainer'
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: invite.title,
    description: invite.description,
    requirements: invite.requirements ?? '',
    value_gbp: String(invite.value_gbp ?? ''),
    slots_total: String(invite.slots_total),
    expires_at: invite.expires_at ? invite.expires_at.split('T')[0] : '',
    fee_gbp: String(invite.fee_gbp ?? ''),
    posts_per_month: String(invite.posts_per_month ?? ''),
    duration_months: String(invite.duration_months ?? ''),
  })

  function addRequirement(chip: typeof REQUIREMENT_CHIPS[0]) {
    setForm(f => ({ ...f, requirements: applyChip(f.requirements, chip) }))
  }

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const payload: Record<string, unknown> = {
      title: form.title,
      description: form.description,
      requirements: form.requirements || null,
    }

    if (isRetainer) {
      payload.fee_gbp = parseFloat(form.fee_gbp)
      payload.posts_per_month = parseInt(form.posts_per_month)
      payload.duration_months = form.duration_months ? parseInt(form.duration_months) : null
    } else {
      payload.value_gbp = parseFloat(form.value_gbp)
      payload.slots_total = parseInt(form.slots_total)
      payload.expires_at = form.expires_at || null
    }

    const res = await fetch(`/api/invites/${invite.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error ?? 'Failed to save')
    } else {
      toast.success('Collab updated')
      onSaved(data)
      onClose()
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/05">
          <div>
            <h2 className="font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Edit collab</h2>
            <p className="text-xs text-gray-400 mt-0.5">Active matches will be notified of any changes.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
          {/* Type indicator — read-only */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400">Type:</span>
            <span
              className="px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide text-[10px]"
              style={{
                background: isRetainer ? 'rgba(107,230,176,0.15)' : 'rgba(245,184,0,0.12)',
                color: isRetainer ? '#059669' : '#b45309',
              }}
            >
              {isRetainer ? 'Retainer' : 'One-off'}
            </span>
            <span className="text-gray-300 text-[10px]">· type cannot be changed</span>
          </div>

          <Input
            label="Title"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            required
          />

          <Textarea
            label="Description"
            rows={3}
            value={form.description}
            onChange={e => set('description', e.target.value)}
            required
          />

          {isRetainer ? (
            <div className="flex flex-col gap-4 rounded-xl p-4" style={{ background: 'rgba(28,43,58,0.03)', border: '1.5px solid rgba(28,43,58,0.08)' }}>
              <p className="text-xs font-semibold text-[#1C2B3A] uppercase tracking-wide" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Retainer terms</p>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Monthly fee (£)"
                  type="number"
                  min="1"
                  step="1"
                  value={form.fee_gbp}
                  onChange={e => set('fee_gbp', e.target.value)}
                  required
                />
                <Input
                  label="Posts per month"
                  type="number"
                  min="1"
                  max="20"
                  value={form.posts_per_month}
                  onChange={e => set('posts_per_month', e.target.value)}
                  required
                />
              </div>
              <Input
                label="Duration (months, optional)"
                type="number"
                min="1"
                max="24"
                placeholder="Leave blank for open-ended"
                value={form.duration_months}
                onChange={e => set('duration_months', e.target.value)}
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Value (£)"
                type="number"
                min="1"
                step="0.01"
                value={form.value_gbp}
                onChange={e => set('value_gbp', e.target.value)}
                required
              />
              <Input
                label="Creator slots"
                type="number"
                min={invite.slots_claimed}
                max="50"
                value={form.slots_total}
                onChange={e => set('slots_total', e.target.value)}
                hint={`Min ${invite.slots_claimed} (already claimed)`}
              />
            </div>
          )}

          {!isRetainer && (
            <Input
              label="Expires (optional)"
              type="date"
              value={form.expires_at}
              onChange={e => set('expires_at', e.target.value)}
            />
          )}

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-[#1C2B3A] uppercase tracking-wide" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Requirements <span className="font-normal text-gray-400 normal-case tracking-normal">optional</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {REQUIREMENT_CHIPS.map(chip => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => addRequirement(chip)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
                  style={{
                    background: 'rgba(59,130,246,0.08)',
                    color: '#2563eb',
                    border: '1px solid rgba(59,130,246,0.2)',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(59,130,246,0.16)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(59,130,246,0.08)' }}
                >
                  + {chip.label}
                </button>
              ))}
            </div>
            <Textarea
              rows={2}
              value={form.requirements}
              onChange={e => set('requirements', e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>Save changes</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
