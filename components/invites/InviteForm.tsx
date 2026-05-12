'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'

const CATEGORIES = [
  { value: 'dining', label: 'Dining & drinks' },
  { value: 'retail', label: 'Retail & shopping' },
  { value: 'experience', label: 'Experience' },
  { value: 'fitness', label: 'Fitness & wellness' },
  { value: 'beauty', label: 'Beauty & lifestyle' },
  { value: 'other', label: 'Other' },
]

export function InviteForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'dining',
    value_gbp: '',
    requirements: '',
    slots_total: '1',
    expires_at: '',
  })

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const res = await fetch('/api/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        value_gbp: parseFloat(form.value_gbp),
        slots_total: parseInt(form.slots_total),
        expires_at: form.expires_at || null,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error ?? 'Failed to create offer')
    } else {
      toast.success('Invite posted!')
      router.push('/business/invites')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-lg">
      <Input
        label="Invite title"
        placeholder="e.g. Complimentary brunch for two"
        value={form.title}
        onChange={e => set('title', e.target.value)}
        required
      />

      <Textarea
        label="Description"
        placeholder="What will the creator receive? What's the experience like?"
        rows={3}
        value={form.description}
        onChange={e => set('description', e.target.value)}
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Category"
          options={CATEGORIES}
          value={form.category}
          onChange={e => set('category', e.target.value)}
        />
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
      </div>

      <Textarea
        label="Requirements (optional)"
        placeholder="e.g. 1 Reel + 2 Stories, tag @yourbusiness, use #CambridgeEats"
        rows={2}
        value={form.requirements}
        onChange={e => set('requirements', e.target.value)}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Creator slots"
          type="number"
          min="1"
          max="10"
          value={form.slots_total}
          onChange={e => set('slots_total', e.target.value)}
          hint="How many creators can claim this offer"
        />
        <Input
          label="Expires (optional)"
          type="date"
          value={form.expires_at}
          onChange={e => set('expires_at', e.target.value)}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" loading={loading}>Post invite</Button>
      </div>
    </form>
  )
}
