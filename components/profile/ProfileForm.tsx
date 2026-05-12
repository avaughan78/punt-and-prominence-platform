'use client'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Camera, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { AddressPicker } from './AddressPicker'
import { createClient } from '@/lib/supabase/client'
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
  userId: string
}

export function ProfileForm({ role, initial, userId }: Props) {
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
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function setAddress(address: string, lat: number, lng: number) {
    setForm(f => ({ ...f, address_line: address, latitude: lat, longitude: lng }))
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Photo must be under 5MB'); return }

    setUploading(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${userId}/avatar.${ext}`

    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (error) {
      toast.error('Upload failed: ' + error.message)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    // Bust cache with timestamp
    const url = `${publicUrl}?t=${Date.now()}`
    setForm(f => ({ ...f, avatar_url: url }))

    // Save immediately
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatar_url: url }),
    })
    toast.success('Photo updated')
    setUploading(false)
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

  const initials = form.display_name
    ? form.display_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-lg">
      {/* Avatar upload */}
      <div>
        <label className="block text-xs font-semibold text-[#1C2B3A] mb-2 uppercase tracking-wide" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          Profile photo
        </label>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="relative w-16 h-16 rounded-full overflow-hidden shrink-0 group"
            style={{ background: 'linear-gradient(135deg, #1C2B3A, #6BE6B0)' }}
          >
            {form.avatar_url ? (
              <img src={form.avatar_url} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold text-lg" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                {initials}
              </span>
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploading
                ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                : <Camera className="w-5 h-5 text-white" />
              }
            </div>
          </button>
          <div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="text-sm font-medium text-[#1C2B3A] hover:underline disabled:opacity-50"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {uploading ? 'Uploading…' : 'Upload photo'}
            </button>
            <p className="text-xs text-gray-400 mt-0.5">JPG or PNG, max 5MB</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
      </div>

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
            <div className="rounded-xl overflow-hidden -mt-1" style={{ border: '1.5px solid rgba(0,0,0,0.08)' }}>
              <iframe
                title="Location preview"
                width="100%"
                height="180"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${form.longitude - 0.008},${form.latitude - 0.005},${form.longitude + 0.008},${form.latitude + 0.005}&layer=mapnik&marker=${form.latitude},${form.longitude}`}
                style={{ display: 'block', border: 'none' }}
              />
              <div className="flex items-center justify-between px-3 py-2" style={{ background: 'rgba(28,43,58,0.03)' }}>
                <span className="text-xs text-gray-500 flex items-center gap-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                  <span style={{ color: '#6BE6B0' }}>✓</span>
                  Location pinned
                </span>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${form.latitude},${form.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs hover:underline"
                  style={{ color: '#1C2B3A', fontFamily: "'Inter', sans-serif" }}
                >
                  Verify on Google Maps →
                </a>
              </div>
            </div>
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
        placeholder="yourhandle"
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
