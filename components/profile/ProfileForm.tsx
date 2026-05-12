'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { AddressPicker } from './AddressPicker'
import type { Role } from '@/lib/types'

const CATEGORIES = [
  { value: 'dining', label: 'Dining & drinks' },
  { value: 'retail', label: 'Retail & shopping' },
  { value: 'experience', label: 'Experience' },
  { value: 'fitness', label: 'Fitness & wellness' },
  { value: 'beauty', label: 'Beauty & lifestyle' },
  { value: 'other', label: 'Other' },
]

interface Props {
  role: Role
  initial: {
    display_name: string
    business_name: string | null
    bio: string | null
    instagram_handle: string | null
    website_url: string | null
    address_line: string | null
    category: string | null
    latitude: number | null
    longitude: number | null
  }
}

export function ProfileForm({ role, initial }: Props) {
  const [form, setForm] = useState({
    display_name: initial.display_name ?? '',
    business_name: initial.business_name ?? '',
    bio: initial.bio ?? '',
    instagram_handle: initial.instagram_handle ?? '',
    website_url: initial.website_url ?? '',
    address_line: initial.address_line ?? '',
    category: initial.category ?? 'other',
    latitude: initial.latitude ?? null as number | null,
    longitude: initial.longitude ?? null as number | null,
  })
  const [loading, setLoading] = useState(false)

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function setAddress(address: string, lat: number, lng: number) {
    setForm(f => ({ ...f, address_line: address, latitude: lat, longitude: lng }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      toast.success('Profile updated')
    } else {
      const d = await res.json()
      toast.error(d.error ?? 'Failed to save')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-lg">
      {role === 'business' ? (
        <>
          <Input
            label="Business name"
            placeholder="The Mill Road Café"
            value={form.display_name}
            onChange={e => set('display_name', e.target.value)}
            required
          />
          <AddressPicker value={form.address_line} onChange={setAddress} />
          {form.latitude && form.longitude && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${form.latitude},${form.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs flex items-center gap-1.5 -mt-2"
              style={{ color: '#1C2B3A', fontFamily: "'Inter', sans-serif" }}
            >
              <span style={{ color: '#6BE6B0' }}>✓</span>
              Location pinned — click to verify on Google Maps
            </a>
          )}
          <Select
            label="Category"
            options={CATEGORIES}
            value={form.category}
            onChange={e => set('category', e.target.value)}
          />
        </>
      ) : (
        <Input
          label="Your name"
          placeholder="Jane Smith"
          value={form.display_name}
          onChange={e => set('display_name', e.target.value)}
          required
        />
      )}

      <Input
        label="Instagram handle"
        placeholder="@yourhandle"
        value={form.instagram_handle}
        onChange={e => set('instagram_handle', e.target.value.replace(/^@/, ''))}
        hint="Without the @"
      />

      <Input
        label="Website"
        type="url"
        placeholder="https://yoursite.com"
        value={form.website_url}
        onChange={e => set('website_url', e.target.value)}
      />

      <Textarea
        label="Bio"
        placeholder={role === 'business'
          ? "Tell creators a bit about your business..."
          : "Tell businesses about yourself and your content style..."}
        rows={3}
        value={form.bio}
        onChange={e => set('bio', e.target.value)}
      />

      <div className="pt-2">
        <Button type="submit" loading={loading}>Save profile</Button>
      </div>
    </form>
  )
}
