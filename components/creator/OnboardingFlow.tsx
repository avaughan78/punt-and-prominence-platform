'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, AlertTriangle, Camera, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { createClient } from '@/lib/supabase/client'

const FOLLOWER_MIN = 1000
const STEPS = ['Your Instagram', 'About you', 'All set!']

interface Props {
  userId: string
  contactName: string
  initialAvatarUrl: string | null
}

interface LookupData {
  handle: string
  name: string | null
  image: string | null
  followers: number | null
  verified: boolean
  isPrivate: boolean
}

export function CreatorOnboardingFlow({ userId, contactName, initialAvatarUrl }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? '')

  const [instagram, setInstagram] = useState('')
  const [followerCount, setFollowerCount] = useState('')
  const [bio, setBio] = useState('')
  const [website, setWebsite] = useState('')
  const [tiktok, setTiktok] = useState('')

  const [looking, setLooking] = useState(false)
  const [lookupData, setLookupData] = useState<LookupData | null>(null)
  const [lookupError, setLookupError] = useState<string | null>(null)

  const [tiktokLooking, setTiktokLooking] = useState(false)
  const [tiktokLookupData, setTiktokLookupData] = useState<LookupData | null>(null)
  const [tiktokLookupError, setTiktokLookupError] = useState<string | null>(null)

  const followers = parseInt(followerCount.replace(/,/g, ''), 10)
  const belowThreshold = followerCount !== '' && !isNaN(followers) && followers < FOLLOWER_MIN

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Photo must be under 5MB'); return }
    setUploading(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${userId}/avatar.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type })
    if (error) { toast.error('Upload failed'); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    const url = `${publicUrl}?t=${Date.now()}`
    setAvatarUrl(url)
    await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ avatar_url: url }) })
    setUploading(false)
  }

  async function saveStep1() {
    if (!instagram.trim()) { toast.error('Please enter your Instagram handle'); return }
    if (!followerCount.trim()) { toast.error('Please enter your follower count'); return }
    const count = parseInt(followerCount.replace(/,/g, ''), 10)
    setSaving(true)
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instagram_handle: instagram.replace(/^@/, ''),
        follower_count: isNaN(count) ? null : count,
        is_approved: isNaN(count) || count >= FOLLOWER_MIN,
      }),
    })
    setSaving(false)
    if (!res.ok) { toast.error('Failed to save'); return }
    setStep(1)
  }

  async function saveStep2() {
    setSaving(true)
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bio: bio || null,
        website_url: website || null,
        tiktok_handle: tiktok.replace(/^@/, '') || null,
        tiktok_follower_count: tiktokLookupData?.followers ?? null,
      }),
    })
    setSaving(false)
    if (!res.ok) { toast.error('Failed to save'); return }
    setStep(2)
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
        setLookupError('This account is private — it must be public to sign up')
        return
      }
      if (data.followers != null) setFollowerCount(String(data.followers))
      if (data.bio) setBio(data.bio)
      if (data.website) setWebsite(data.website)
      if (data.image) {
        setAvatarUrl(data.image)
        await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ avatar_url: data.image }) })
      }
      setLookupData({ handle: data.handle, name: data.name, image: data.image, followers: data.followers, verified: data.verified, isPrivate: false })
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
      // Only cache photo if Instagram didn't already set one
      const cachePhoto = !avatarUrl
      const res = await fetch(`/api/tiktok/lookup?handle=${encodeURIComponent(clean)}&userId=${encodeURIComponent(userId)}&cachePhoto=${cachePhoto}`)
      const data = await res.json()
      if (!res.ok) {
        setTiktokLookupError(data.error ?? 'Profile not found — check the handle and try again')
        return
      }
      if (data.isPrivate) {
        setTiktokLookupError('This account is private — it must be public to verify')
        return
      }
      if (!bio && data.bio) setBio(data.bio)
      if (!website && data.website) setWebsite(data.website)
      if (!avatarUrl && data.image) {
        setAvatarUrl(data.image)
        await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ avatar_url: data.image }) })
      }
      setTiktokLookupData({ handle: data.handle, name: data.name, image: data.image, followers: data.followers, verified: data.verified, isPrivate: false })
    } finally {
      setTiktokLooking(false)
    }
  }

  const initials = contactName
    ? contactName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <div className="max-w-lg mx-auto">
      {/* Progress */}
      <div className="flex items-center gap-0 mb-10">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all"
                style={{
                  background: i < step ? '#6BE6B0' : i === step ? '#F5B800' : 'rgba(0,0,0,0.08)',
                  color: i <= step ? '#1C2B3A' : '#9ca3af',
                }}
              >
                {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <p className="text-[10px] mt-1 text-center" style={{ color: i === step ? '#1C2B3A' : '#9ca3af', fontFamily: "'JetBrains Mono', monospace" }}>
                {label}
              </p>
            </div>
            {i < STEPS.length - 1 && (
              <div className="h-0.5 flex-1 -mt-4 transition-all" style={{ background: i < step ? '#6BE6B0' : 'rgba(0,0,0,0.08)' }} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1 — Instagram */}
      {step === 0 && (
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="text-xl font-bold text-[#1C2B3A] mb-1" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              Your Instagram, {contactName.split(' ')[0]}
            </h2>
            <p className="text-sm text-gray-500">Enter your handle and we&apos;ll pull in your profile automatically.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#1C2B3A] uppercase tracking-wide" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Instagram handle
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">@</span>
              <input
                placeholder="yourhandle"
                value={instagram}
                onChange={e => {
                  setInstagram(e.target.value.replace(/^@/, ''))
                  setLookupData(null)
                  setLookupError(null)
                }}
                onBlur={e => { if (e.target.value.trim()) lookupInstagram(e.target.value) }}
                className="w-full pl-8 pr-10 py-3 rounded-xl border text-sm bg-white text-[#1C2B3A] placeholder-[#9ca3af] transition-all outline-none border-black/10 focus:border-[#F5B800] focus:ring-2 focus:ring-[#F5B800]/20"
                style={{ fontFamily: "'Inter', sans-serif" }}
              />
              {looking && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
              )}
              {lookupData && !looking && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#059669' }} />
              )}
            </div>
            <p className="text-xs text-gray-400">Must be a public account — we&apos;ll verify it automatically</p>
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
              <div className="flex-1">
                <p className="text-xs text-red-600">{lookupError}</p>
              </div>
              <button
                type="button"
                onClick={() => lookupInstagram(instagram)}
                className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700 shrink-0"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
            </div>
          )}

          {/* Follower count — shown if lookup succeeded or if there was an error (manual fallback) */}
          {(lookupData || lookupError) && (
            <div className="flex flex-col gap-1.5">
              <Input
                label="Follower count"
                type="number"
                placeholder="e.g. 2500"
                value={followerCount}
                onChange={e => setFollowerCount(e.target.value)}
                required
              />
              {belowThreshold && (
                <div className="flex items-start gap-2 rounded-xl px-3 py-2.5" style={{ background: 'rgba(245,184,0,0.08)', border: '1px solid rgba(245,184,0,0.25)' }}>
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#F5B800' }} />
                  <p className="text-xs text-gray-600" style={{ fontFamily: "'Inter', sans-serif" }}>
                    We typically work with creators with <strong>1,000+ followers</strong>. You can still sign up — we&apos;ll review your profile and be in touch.
                  </p>
                </div>
              )}

              {/* Avatar upload override */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 group"
                  style={{ background: 'linear-gradient(135deg, #1C2B3A, #6BE6B0)' }}
                >
                  {avatarUrl
                    ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                    : <span className="text-white font-bold text-xs">{initials}</span>
                  }
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {uploading ? <Loader2 className="w-3 h-3 text-white animate-spin" /> : <Camera className="w-3 h-3 text-white" />}
                  </div>
                </button>
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="text-xs text-gray-400 hover:text-gray-600 hover:underline disabled:opacity-50">
                  {uploading ? 'Uploading…' : avatarUrl ? 'Change profile photo' : 'Add a profile photo'}
                </button>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
              </div>
            </div>
          )}

          <Button onClick={saveStep1} loading={saving} disabled={looking || (!lookupData && !lookupError)}>
            {!lookupData && !lookupError && !looking ? 'Enter your handle above →' : 'Continue →'}
          </Button>
          {!lookupData && lookupError && (
            <button type="button" onClick={saveStep1} className="text-xs text-center text-gray-400 hover:text-gray-600 -mt-2">
              Skip verification and continue anyway
            </button>
          )}
        </div>
      )}

      {/* Step 2 — About you */}
      {step === 1 && (
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="text-xl font-bold text-[#1C2B3A] mb-1" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              Tell businesses about yourself
            </h2>
            <p className="text-sm text-gray-500">All fields are optional — add what you have.</p>
          </div>

          {/* TikTok handle with auto-lookup */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#1C2B3A] uppercase tracking-wide" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              TikTok handle <span className="text-gray-400 normal-case font-normal">· optional</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">@</span>
              <input
                placeholder="yourtiktok"
                value={tiktok}
                onChange={e => { setTiktok(e.target.value.replace(/^@/, '')); setTiktokLookupData(null); setTiktokLookupError(null) }}
                onBlur={e => { if (e.target.value.trim()) lookupTiktok(e.target.value) }}
                className="w-full pl-8 pr-10 py-3 rounded-xl border text-sm bg-white text-[#1C2B3A] placeholder-[#9ca3af] transition-all outline-none border-black/10 focus:border-[#F5B800] focus:ring-2 focus:ring-[#F5B800]/20"
                style={{ fontFamily: "'Inter', sans-serif" }}
              />
              {tiktokLooking && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />}
              {tiktokLookupData && !tiktokLooking && <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#059669' }} />}
            </div>
          </div>

          {/* TikTok preview card */}
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
              <button type="button" onClick={() => lookupTiktok(tiktok)} className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700 shrink-0">
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
            </div>
          )}

          <Textarea
            label="Bio"
            placeholder="Food and lifestyle creator based in Cambridge. I shoot warm, editorial content and love supporting independent businesses…"
            rows={4}
            value={bio}
            onChange={e => setBio(e.target.value)}
          />
          <Input
            label="Website or link in bio"
            type="url"
            placeholder="https://yoursite.com"
            value={website}
            onChange={e => setWebsite(e.target.value)}
          />

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setStep(0)}>Back</Button>
            <Button onClick={saveStep2} loading={saving} className="flex-1">Continue →</Button>
          </div>
        </div>
      )}

      {/* Step 3 — Done */}
      {step === 2 && (
        <div className="flex flex-col items-center text-center gap-6 py-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #1C2B3A, #6BE6B0)' }}
          >
            <Check className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#1C2B3A] mb-2" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              You&apos;re in, {contactName.split(' ')[0]}!
            </h2>
            <p className="text-sm text-gray-500 max-w-sm">
              Browse invites from Cambridge businesses and claim one that fits your style. Visit, create, post — it&apos;s that simple.
            </p>
          </div>
          <Button onClick={() => router.push('/creator/browse')}>
            Browse invites
          </Button>
        </div>
      )}
    </div>
  )
}
