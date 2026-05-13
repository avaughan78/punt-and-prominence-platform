'use client'
import { useRef, useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Camera, Loader2, MapPin, Search } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { MapPickerModal } from './MapPickerModal'
import { loadGoogleMaps } from '@/lib/googleMaps'
import { createClient } from '@/lib/supabase/client'
import type { Role } from '@/lib/types'

const CAMBRIDGE_BOUNDS = { sw: { lat: 52.15, lng: 0.03 }, ne: { lat: 52.27, lng: 0.22 } }
function stripCountry(s: string) { return s.replace(/, United Kingdom$/, '').replace(/, UK$/, '') }

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
    follower_count: number | null
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
    follower_count: initial.follower_count ?? null as number | null,
  })
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const acLoadedRef = useRef(false)

  useEffect(() => {
    if (role !== 'business' || acLoadedRef.current) return
    loadGoogleMaps().then(() => {
      if (!searchRef.current || acLoadedRef.current) return
      acLoadedRef.current = true
      const bounds = new window.google.maps.LatLngBounds(CAMBRIDGE_BOUNDS.sw, CAMBRIDGE_BOUNDS.ne)
      const ac = new window.google.maps.places.Autocomplete(searchRef.current, {
        bounds,
        strictBounds: false,
        componentRestrictions: { country: 'gb' },
        fields: ['name', 'formatted_address', 'geometry', 'types'],
      })
      ac.addListener('place_changed', () => {
        const place = ac.getPlace()
        if (!place.geometry?.location) return
        const isEstablishment = (place.types ?? []).includes('establishment')
        setForm(f => ({
          ...f,
          ...(isEstablishment ? { business_name: place.name ?? f.business_name } : {}),
          address_line: stripCountry(place.formatted_address ?? ''),
          latitude: place.geometry!.location!.lat(),
          longitude: place.geometry!.location!.lng(),
        }))
        if (searchRef.current) searchRef.current.value = ''
      })
    })
  }, [role])

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
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
    <>
    {showMap && (
      <MapPickerModal
        lat={form.latitude}
        lng={form.longitude}
        onConfirm={(address, lat, lng, name) => setForm(f => ({
          ...f,
          address_line: address,
          latitude: lat,
          longitude: lng,
          ...(name ? { business_name: name } : {}),
        }))}
        onClose={() => setShowMap(false)}
      />
    )}
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
            label="Your name"
            placeholder="Jane Smith"
            value={form.display_name}
            onChange={e => set('display_name', e.target.value)}
            required
          />

          {/* Location search row */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search to update business location…"
                autoComplete="off"
                className="w-full pl-9 pr-4 py-3 rounded-xl border text-sm bg-white text-[#1C2B3A] placeholder-[#9ca3af] outline-none border-black/10 focus:border-[#F5B800] focus:ring-2 focus:ring-[#F5B800]/20"
                style={{ fontFamily: "'Inter', sans-serif" }}
              />
            </div>
            <button
              type="button"
              onClick={() => setShowMap(true)}
              title="Pick on map"
              className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all hover:bg-[#1C2B3A] group"
              style={{ border: '1.5px solid rgba(0,0,0,0.1)', background: 'white' }}
            >
              <MapPin className="w-4 h-4 text-gray-400 group-hover:text-[#6BE6B0] transition-colors" />
            </button>
          </div>

          {/* Location result card */}
          {(form.business_name || form.address_line) && (
            <div className="flex flex-col gap-3 rounded-2xl p-4" style={{ background: 'rgba(107,230,176,0.06)', border: '1.5px solid rgba(107,230,176,0.25)' }}>
              <Input
                label="Business name"
                placeholder="The Mill Road Café"
                value={form.business_name}
                onChange={e => set('business_name', e.target.value)}
                required
              />
              <Input
                label="Address"
                placeholder="123 Mill Road, Cambridge, CB1 2AZ"
                value={form.address_line}
                onChange={e => set('address_line', e.target.value)}
              />
              {form.latitude && form.longitude && (
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.08)' }}>
                  <iframe
                    title="Location"
                    width="100%"
                    height="160"
                    style={{ display: 'block', border: 'none' }}
                    src={`https://maps.google.com/maps?q=${form.latitude},${form.longitude}&z=17&output=embed`}
                  />
                </div>
              )}
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
        <>
          <Input
            label="Your name"
            placeholder="Jane Smith"
            value={form.display_name}
            onChange={e => set('display_name', e.target.value)}
            required
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#1C2B3A] uppercase tracking-wide" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Instagram followers
            </label>
            <input
              type="number"
              min={0}
              placeholder="e.g. 5000"
              value={form.follower_count ?? ''}
              onChange={e => setForm(f => ({ ...f, follower_count: e.target.value ? parseInt(e.target.value) : null }))}
              className="w-full px-4 py-3 rounded-xl border text-sm bg-white text-[#1C2B3A] placeholder-[#9ca3af] transition-all outline-none border-black/10 focus:border-[#F5B800] focus:ring-2 focus:ring-[#F5B800]/20"
              style={{ fontFamily: "'Inter', sans-serif" }}
            />
            {form.follower_count != null && form.follower_count < 1000 && (
              <p className="text-xs font-medium" style={{ color: '#F5B800' }}>
                We recommend creators with 1,000+ followers — your profile may be flagged for review.
              </p>
            )}
          </div>
        </>
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
    </>
  )
}
