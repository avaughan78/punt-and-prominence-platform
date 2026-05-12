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
    avatar_url: string | null
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
    avatar_url: initial.avatar_url ?? '',
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

      {/* Avatar */}
      <div>
        <label className="block text-xs font-semibold text-[#1C2B3A] mb-1.5 uppercase tracking-wide" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          Profile photo URL
        </label>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-sm font-bold" style={{ background: 'linear-gradient(135deg, #1C2B3A, #6BE6B0)', color: '#fff' }}>
            {form.avatar_url
              ? <img src={form.avatar_url} alt="avatar" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              : (form.display_name ? form.display_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?')}
          </div>
          <input
            type="url"
            placeholder="Paste any image URL (e.g. from your Instagram)"
            value={form.avatar_url}
            onChange={e => set('avatar_url', e.target.value)}
            className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
            style={{ border: '1.5px solid rgba(0,0,0,0.1)', background: '#fff', fontFamily: "'Inter', sans-serif", color: '#1C2B3A' }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1.5" style={{ fontFamily: "'Inter', sans-serif" }}>
          Tip: on Instagram, open your profile, long-press your photo and choose &ldquo;Copy image address&rdquo;
        </p>
      </div>

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
