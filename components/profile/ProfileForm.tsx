'use client'
import { useRef, useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Camera, Loader2, MapPin, Search, Check, AlertTriangle, RefreshCw } from 'lucide-react'
import { SocialHandleInput } from '@/components/ui/SocialHandleInput'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { MapPickerModal } from './MapPickerModal'
import { loadGoogleMaps } from '@/lib/googleMaps'
import { createClient } from '@/lib/supabase/client'
import { normalizeUrl } from '@/lib/utils'
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

interface LookupData {
  handle: string
  name: string | null
  image: string | null
  followers: number | null
  verified: boolean
  isPrivate?: boolean
}

export interface ProfileFormData {
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
  tiktok_handle: string | null
  tiktok_follower_count: number | null
  media_count: number | null
}

interface Props {
  role: Role
  initial: ProfileFormData
  userId: string
  onSaved?: (data: ProfileFormData) => void
}

export function ProfileForm({ role, initial, userId, onSaved }: Props) {
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
    tiktok_handle: initial.tiktok_handle ?? '',
    tiktok_follower_count: initial.tiktok_follower_count ?? null as number | null,
    media_count: initial.media_count ?? null as number | null,
  })
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const acLoadedRef = useRef(false)

  const [looking, setLooking] = useState(false)
  const [lookupData, setLookupData] = useState<LookupData | null>(null)
  const [lookupError, setLookupError] = useState<string | null>(null)

  const [tiktokLooking, setTiktokLooking] = useState(false)
  const [tiktokLookupData, setTiktokLookupData] = useState<LookupData | null>(null)
  const [tiktokLookupError, setTiktokLookupError] = useState<string | null>(null)
  const [websiteUrlError, setWebsiteUrlError] = useState<string | null>(null)

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
    const url = `${publicUrl}?t=${Date.now()}`
    setForm(f => ({ ...f, avatar_url: url }))

    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatar_url: url }),
    })
    toast.success('Photo updated')
    setUploading(false)
  }

  async function lookupInstagram(handle: string) {
    const clean = handle.replace(/^@/, '').trim()
    if (!clean) return
    setLooking(true)
    setLookupData(null)
    setLookupError(null)
    try {
      const res = await fetch(`/api/instagram/lookup?handle=${encodeURIComponent(clean)}&userId=${encodeURIComponent(userId)}`)
      const data = await res.json()
      if (!res.ok) {
        setLookupError(data.error ?? 'Profile not found — check the handle is correct and the account is public')
        return
      }
      if (data.isPrivate) {
        setLookupError('This account is private — make it public to sync your stats')
        return
      }
      setForm(f => ({
        ...f,
        follower_count: data.followers ?? f.follower_count,
        media_count: data.posts ?? f.media_count,
        bio: data.bio || f.bio,
        website_url: data.website || f.website_url,
        avatar_url: data.image || f.avatar_url,
      }))
      if (data.image) {
        await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ avatar_url: data.image }) })
      }
      setLookupData({ handle: data.handle, name: data.name, image: data.image, followers: data.followers, verified: data.verified })
    } finally {
      setLooking(false)
    }
  }

  async function lookupTiktok(handle: string) {
    const clean = handle.replace(/^@/, '').trim()
    if (!clean) return
    setTiktokLooking(true)
    setTiktokLookupData(null)
    setTiktokLookupError(null)
    try {
      const cachePhoto = !form.avatar_url
      const res = await fetch(`/api/tiktok/lookup?handle=${encodeURIComponent(clean)}&userId=${encodeURIComponent(userId)}&cachePhoto=${cachePhoto}`)
      const data = await res.json()
      if (!res.ok) { setTiktokLookupError(data.error ?? 'Profile not found — check the handle and try again'); return }
      if (data.isPrivate) { setTiktokLookupError('This account is private — make it public to sync your stats'); return }
      setForm(f => ({
        ...f,
        tiktok_follower_count: data.followers ?? f.tiktok_follower_count,
        bio: data.bio || f.bio,
        website_url: data.website || f.website_url,
        ...((!f.avatar_url && data.image) ? { avatar_url: data.image } : {}),
      }))
      if (!form.avatar_url && data.image) {
        await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ avatar_url: data.image }) })
      }
      setTiktokLookupData({ handle: data.handle, name: data.name, image: data.image, followers: data.followers, verified: data.verified })
    } finally {
      setTiktokLooking(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.website_url) {
      const normalized = normalizeUrl(form.website_url)
      if (!normalized) { setWebsiteUrlError('Enter a valid URL (e.g. www.yoursite.com)'); return }
      setForm(f => ({ ...f, website_url: normalized }))
      setWebsiteUrlError(null)
    }
    setLoading(true)
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      toast.success('Profile updated')
      onSaved?.(form)
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

          {/* Instagram handle with lookup */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#1C2B3A] uppercase tracking-wide" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Instagram handle
            </label>
            <SocialHandleInput
              platform="instagram"
              value={form.instagram_handle}
              onChange={v => { set('instagram_handle', v); setLookupData(null); setLookupError(null) }}
              onVerify={() => lookupInstagram(form.instagram_handle)}
              looking={looking}
              verified={!!lookupData}
            />
            <p className="text-xs text-gray-400">Must be a public account — tap → to sync stats</p>
          </div>

          {/* Profile preview card */}
          {lookupData && (
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: 'rgba(107,230,176,0.08)', border: '1px solid rgba(107,230,176,0.3)' }}
            >
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-full overflow-hidden" style={{ background: 'linear-gradient(135deg, #1C2B3A, #6BE6B0)' }}>
                  {lookupData.image
                    ? <img src={lookupData.image} alt="" className="w-full h-full object-cover" />
                    : <span className="w-full h-full flex items-center justify-center text-white font-bold text-sm">{initials}</span>
                  }
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#059669' }}>
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-[#1C2B3A] truncate" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                    {lookupData.name ?? `@${lookupData.handle}`}
                  </p>
                  {lookupData.verified && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0" style={{ background: 'rgba(245,184,0,0.15)', color: '#b45309', fontFamily: "'JetBrains Mono', monospace" }}>
                      VERIFIED
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">@{lookupData.handle}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                  {lookupData.followers != null ? lookupData.followers.toLocaleString() : '—'}
                </p>
                <p className="text-[10px] text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>followers</p>
              </div>
            </div>
          )}

          {/* Error state */}
          {lookupError && (
            <div className="flex items-start gap-3 rounded-xl px-4 py-3" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <p className="text-xs text-red-600 flex-1">{lookupError}</p>
              <button
                type="button"
                onClick={() => lookupInstagram(form.instagram_handle)}
                className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700 shrink-0"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
            </div>
          )}

          {/* Follower count — read-only, set via API sync only */}
          {!lookupData && form.follower_count != null && (
            <div
              className="flex items-center justify-between rounded-xl px-4 py-3"
              style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.08)' }}
            >
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Instagram followers</p>
                <p className="text-sm font-bold text-[#1C2B3A] mt-0.5" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                  {form.follower_count.toLocaleString()}
                </p>
              </div>
              <p className="text-[10px] text-gray-400" style={{ fontFamily: "'Inter', sans-serif" }}>Tap → above to re-sync</p>
            </div>
          )}
          {form.follower_count != null && form.follower_count < 1000 && (
            <p className="text-xs font-medium" style={{ color: '#F5B800' }}>
              We recommend creators with 1,000+ followers — your profile may be flagged for review.
            </p>
          )}

          {/* TikTok handle with lookup */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#1C2B3A] uppercase tracking-wide" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              TikTok handle <span className="text-gray-400 normal-case font-normal">· optional</span>
            </label>
            <SocialHandleInput
              platform="tiktok"
              value={form.tiktok_handle}
              onChange={v => { set('tiktok_handle', v); setTiktokLookupData(null); setTiktokLookupError(null) }}
              onVerify={() => lookupTiktok(form.tiktok_handle)}
              looking={tiktokLooking}
              verified={!!tiktokLookupData}
              placeholder="yourtiktok"
            />
            <p className="text-xs text-gray-400">Tap → to sync stats</p>
          </div>

          {tiktokLookupData && (
            <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: 'rgba(107,230,176,0.08)', border: '1px solid rgba(107,230,176,0.3)' }}>
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-full overflow-hidden" style={{ background: 'linear-gradient(135deg, #1C2B3A, #6BE6B0)' }}>
                  {tiktokLookupData.image
                    ? <img src={tiktokLookupData.image} alt="" className="w-full h-full object-cover" />
                    : <span className="w-full h-full flex items-center justify-center text-white font-bold text-sm">{initials}</span>
                  }
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#059669' }}>
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-[#1C2B3A] truncate" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                    {tiktokLookupData.name ?? `@${tiktokLookupData.handle}`}
                  </p>
                  {tiktokLookupData.verified && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0" style={{ background: 'rgba(245,184,0,0.15)', color: '#b45309', fontFamily: "'JetBrains Mono', monospace" }}>
                      VERIFIED
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">@{tiktokLookupData.handle} on TikTok</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                  {tiktokLookupData.followers != null ? tiktokLookupData.followers.toLocaleString() : '—'}
                </p>
                <p className="text-[10px] text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>followers</p>
              </div>
            </div>
          )}

          {tiktokLookupError && (
            <div className="flex items-start gap-3 rounded-xl px-4 py-3" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <p className="text-xs text-red-600 flex-1">{tiktokLookupError}</p>
              <button type="button" onClick={() => lookupTiktok(form.tiktok_handle)} className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700 shrink-0">
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
            </div>
          )}
        </>
      )}

      {role === 'business' && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#1C2B3A] uppercase tracking-wide" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Instagram handle <span className="text-gray-400 normal-case font-normal">· optional</span>
          </label>
          <SocialHandleInput
            platform="instagram"
            value={form.instagram_handle}
            onChange={v => { set('instagram_handle', v); setLookupData(null); setLookupError(null) }}
            onVerify={() => lookupInstagram(form.instagram_handle)}
            looking={looking}
            verified={!!lookupData}
            placeholder="yourbiz"
          />
          <p className="text-xs text-gray-400">Tap → to sync your profile photo and bio</p>
        </div>
      )}

      {role === 'business' && lookupData && (
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{ background: 'rgba(107,230,176,0.08)', border: '1px solid rgba(107,230,176,0.3)' }}
        >
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-full overflow-hidden" style={{ background: 'linear-gradient(135deg, #1C2B3A, #6BE6B0)' }}>
              {lookupData.image
                ? <img src={lookupData.image} alt="" className="w-full h-full object-cover" />
                : <span className="w-full h-full flex items-center justify-center text-white font-bold text-sm">{initials}</span>
              }
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#059669' }}>
              <Check className="w-2.5 h-2.5 text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-[#1C2B3A] truncate" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                {lookupData.name ?? `@${lookupData.handle}`}
              </p>
              {lookupData.verified && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0" style={{ background: 'rgba(245,184,0,0.15)', color: '#b45309', fontFamily: "'JetBrains Mono', monospace" }}>
                  VERIFIED
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">@{lookupData.handle}</p>
          </div>
          {lookupData.followers != null && (
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                {lookupData.followers.toLocaleString()}
              </p>
              <p className="text-[10px] text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>followers</p>
            </div>
          )}
        </div>
      )}

      {role === 'business' && lookupError && (
        <div className="flex items-start gap-3 rounded-xl px-4 py-3" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
          <p className="text-xs text-red-600 flex-1">{lookupError}</p>
          <button
            type="button"
            onClick={() => lookupInstagram(form.instagram_handle)}
            className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700 shrink-0"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        </div>
      )}

      <div>
        <Input
          label="Website"
          placeholder="https://yoursite.com"
          value={form.website_url}
          onChange={e => { set('website_url', e.target.value); setWebsiteUrlError(null) }}
        />
        {websiteUrlError && <p className="text-xs text-red-500 mt-1">{websiteUrlError}</p>}
      </div>

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
