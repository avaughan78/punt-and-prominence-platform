'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { REQUIREMENT_CHIPS, applyChip } from '@/lib/requirementChips'

const CATEGORIES = [
  { value: 'dining', label: 'Dining & drinks' },
  { value: 'retail', label: 'Retail & shopping' },
  { value: 'experience', label: 'Experience' },
  { value: 'fitness', label: 'Fitness & wellness' },
  { value: 'beauty', label: 'Beauty & lifestyle' },
  { value: 'other', label: 'Other' },
]

export function InviteForm({ instagramHandle }: { instagramHandle: string | null }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [inviteType, setInviteType] = useState<'one_off' | 'retainer'>('one_off')
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'dining',
    // one_off
    value_gbp: '',
    slots_total: '1',
    expires_at: '',
    // retainer
    fee_gbp: '',
    posts_per_month: '1',
    duration_months: '',
    // shared
    requirements: '',
  })

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function addRequirement(chip: typeof REQUIREMENT_CHIPS[0]) {
    const resolved = chip.label === 'Tag us' && instagramHandle
      ? { ...chip, text: `tag @${instagramHandle}` }
      : chip
    setForm(f => ({ ...f, requirements: applyChip(f.requirements, resolved) }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const payload = inviteType === 'one_off'
      ? {
          title: form.title,
          description: form.description,
          category: form.category,
          requirements: form.requirements || null,
          invite_type: 'one_off',
          value_gbp: parseFloat(form.value_gbp),
          slots_total: parseInt(form.slots_total),
          expires_at: form.expires_at || null,
        }
      : {
          title: form.title,
          description: form.description,
          category: form.category,
          requirements: form.requirements || null,
          invite_type: 'retainer',
          value_gbp: 0,
          fee_gbp: parseFloat(form.fee_gbp),
          posts_per_month: parseInt(form.posts_per_month),
          duration_months: form.duration_months ? parseInt(form.duration_months) : null,
          slots_total: 1,
        }

    const res = await fetch('/api/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error ?? 'Failed to create collab')
    } else {
      toast.success(inviteType === 'retainer' ? 'Retainer posted!' : 'Collab posted!')
      router.push('/business/invites')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-lg">
      {/* Type toggle */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-[#1C2B3A] uppercase tracking-wide" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          Arrangement type
        </label>
        <div className="grid grid-cols-2 gap-2">
          {([
            { value: 'one_off', label: 'One-off collab', sub: 'Creator visits once and posts' },
            { value: 'retainer', label: 'Retainer', sub: 'Ongoing monthly arrangement' },
          ] as const).map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setInviteType(opt.value)}
              className="flex flex-col items-start p-3 rounded-xl text-left transition-all"
              style={{
                border: inviteType === opt.value ? '2px solid #1C2B3A' : '1.5px solid rgba(0,0,0,0.1)',
                background: inviteType === opt.value ? 'rgba(28,43,58,0.04)' : 'white',
              }}
            >
              <span className="text-sm font-semibold text-[#1C2B3A]">{opt.label}</span>
              <span className="text-xs text-gray-400 mt-0.5">{opt.sub}</span>
            </button>
          ))}
        </div>
      </div>

      <Input
        label="Title"
        placeholder={inviteType === 'retainer' ? 'e.g. Monthly food content partnership' : 'e.g. Complimentary brunch for two'}
        value={form.title}
        onChange={e => set('title', e.target.value)}
        required
      />

      <Textarea
        label="Description"
        placeholder={inviteType === 'retainer'
          ? "What's included each month? What kind of content are you looking for?"
          : "What will the creator receive? What's the experience like?"}
        rows={3}
        value={form.description}
        onChange={e => set('description', e.target.value)}
        required
      />

      <Select
        label="Category"
        options={CATEGORIES}
        value={form.category}
        onChange={e => set('category', e.target.value)}
      />

      {inviteType === 'one_off' ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Value (£)"
              type="number"
              placeholder="25.00"
              min="1"
              step="0.01"
              value={form.value_gbp}
              onChange={e => set('value_gbp', e.target.value)}
              required
            />
            <Input
              label="Creator slots"
              type="number"
              min="1"
              max="10"
              value={form.slots_total}
              onChange={e => set('slots_total', e.target.value)}
              hint="How many creators can claim this"
            />
          </div>
          <Input
            label="Expires (optional)"
            type="date"
            value={form.expires_at}
            onChange={e => set('expires_at', e.target.value)}
          />
        </>
      ) : (
        <div className="flex flex-col gap-4 rounded-xl p-4" style={{ background: 'rgba(28,43,58,0.03)', border: '1.5px solid rgba(28,43,58,0.08)' }}>
          <p className="text-xs font-semibold text-[#1C2B3A] uppercase tracking-wide" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Retainer terms</p>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Monthly fee (£)"
              type="number"
              placeholder="200"
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
            placeholder="e.g. 3 — leave blank for open-ended"
            value={form.duration_months}
            onChange={e => set('duration_months', e.target.value)}
            hint="Leave blank for open-ended"
          />
        </div>
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
          placeholder={inviteType === 'retainer'
            ? 'e.g. 1 Reel + 2 Stories per month, tag @yourbusiness'
            : 'e.g. 1 Reel + 2 Stories, tag @yourbusiness, use #CambridgeEats'}
          rows={2}
          value={form.requirements}
          onChange={e => set('requirements', e.target.value)}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" loading={loading}>
          {inviteType === 'retainer' ? 'Post retainer' : 'Post collab'}
        </Button>
      </div>
    </form>
  )
}
