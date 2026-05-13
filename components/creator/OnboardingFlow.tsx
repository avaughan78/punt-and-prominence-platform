'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, AlertTriangle, Camera, Loader2, Search } from 'lucide-react'
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
  const [looking, setLooking] = useState(false)
  const [lookupResult, setLookupResult] = useState<{ verified?: boolean; isPrivate?: boolean } | null>(null)

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
      }),
    })
    setSaving(false)
    if (!res.ok) { toast.error('Failed to save'); return }
    setStep(2)
  }

  async function lookupInstagram() {
    if (!instagram.trim()) { toast.error('Enter your Instagram handle first'); return }
    setLooking(true)
    setLookupResult(null)
    try {
      const res = await fetch(`/api/instagram/lookup?handle=${encodeURIComponent(instagram)}`)
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Profile not found — check the handle and try again'); return }
      if (data.isPrivate) { toast.error('This account is private — it must be public to be verified'); return }
      if (data.followers != null) setFollowerCount(String(data.followers))
      if (data.bio && !bio) setBio(data.bio)
      if (data.website && !website) setWebsite(data.website)
      if (data.image && !avatarUrl) {
        setAvatarUrl(data.image)
        await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ avatar_url: data.image }) })
      }
      setLookupResult({ verified: data.verified, isPrivate: false })
      toast.success('Profile found — stats filled in!')
    } finally {
      setLooking(false)
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
            <p className="text-sm text-gray-500">Businesses will use this to find and verify your content.</p>
          </div>

          {/* Avatar upload */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="relative w-16 h-16 rounded-full overflow-hidden shrink-0 group"
              style={{ background: 'linear-gradient(135deg, #1C2B3A, #6BE6B0)' }}
            >
              {avatarUrl
                ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                : <span className="text-white font-bold text-lg" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>{initials}</span>
              }
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
              </div>
            </button>
            <div>
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                className="text-sm font-medium text-[#1C2B3A] hover:underline disabled:opacity-50">
                {uploading ? 'Uploading…' : 'Add a profile photo'}
              </button>
              <p className="text-xs text-gray-400 mt-0.5">JPG or PNG, max 5MB</p>
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#1C2B3A] uppercase tracking-wide" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Instagram handle
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">@</span>
                <input
                  placeholder="yourhandle"
                  value={instagram}
                  onChange={e => { setInstagram(e.target.value.replace(/^@/, '')); setLookupResult(null) }}
                  className="w-full pl-8 pr-4 py-3 rounded-xl border text-sm bg-white text-[#1C2B3A] placeholder-[#9ca3af] transition-all outline-none border-black/10 focus:border-[#F5B800] focus:ring-2 focus:ring-[#F5B800]/20"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                />
              </div>
              <button
                type="button"
                onClick={lookupInstagram}
                disabled={looking || !instagram.trim()}
                className="px-3 py-3 rounded-xl border text-sm font-medium transition-all disabled:opacity-40 flex items-center gap-1.5 shrink-0"
                style={{ border: '1px solid rgba(0,0,0,0.1)', color: '#1C2B3A', background: 'white', fontFamily: "'Inter', sans-serif" }}
              >
                {looking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {looking ? 'Looking up…' : 'Look up'}
              </button>
            </div>
            {lookupResult && (
              <div className="flex items-center gap-1.5 text-xs" style={{ color: '#059669' }}>
                <Check className="w-3.5 h-3.5" />
                Profile found{lookupResult.verified ? ' · Verified account' : ''} — stats filled in
              </div>
            )}
            {!lookupResult && <p className="text-xs text-gray-400">Must be a public account · Click Look up to auto-fill your stats</p>}
          </div>

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
          </div>

          <Button onClick={saveStep1} loading={saving}>Continue →</Button>
        </div>
      )}

      {/* Step 2 — About you */}
      {step === 1 && (
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="text-xl font-bold text-[#1C2B3A] mb-1" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              Tell businesses about yourself
            </h2>
            <p className="text-sm text-gray-500">Help businesses understand your content style. Both fields are optional.</p>
          </div>

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
