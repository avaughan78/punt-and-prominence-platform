'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, AlertTriangle, Camera, Loader2, Search, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { createClient } from '@/lib/supabase/client'

const FOLLOWER_MIN = 1000
const STEPS = ['Your Instagram', 'About you', 'All set!']

interface IGProfile {
  username: string
  full_name: string | null
  biography: string | null
  profile_pic_url: string | null
  follower_count: number | null
  post_count: number | null
  is_verified: boolean
}

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
  const [igProfile, setIgProfile] = useState<IGProfile | null>(null)
  const [looking, setLooking] = useState(false)
  const [followerCount, setFollowerCount] = useState('')
  const [bio, setBio] = useState('')
  const [website, setWebsite] = useState('')

  const followers = igProfile?.follower_count ?? parseInt(followerCount.replace(/,/g, ''), 10)
  const belowThreshold = !isNaN(followers) && followers < FOLLOWER_MIN

  async function lookupInstagram() {
    const handle = instagram.replace(/^@/, '').trim()
    if (!handle) { toast.error('Enter your Instagram handle first'); return }
    setLooking(true)
    setIgProfile(null)
    try {
      const res = await fetch(`/api/instagram/${encodeURIComponent(handle)}`)
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Could not find profile'); setLooking(false); return }
      setIgProfile(data)
      if (data.follower_count != null) setFollowerCount(String(data.follower_count))
      if (data.biography) setBio(prev => prev || data.biography)
    } catch {
      toast.error('Could not reach Instagram — enter your follower count manually')
    }
    setLooking(false)
  }

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
    const count = igProfile?.follower_count ?? (followerCount ? parseInt(followerCount.replace(/,/g, ''), 10) : null)
    setSaving(true)
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instagram_handle: instagram.replace(/^@/, ''),
        follower_count: count,
        bio: igProfile?.biography ?? undefined,
        is_approved: count == null || count >= FOLLOWER_MIN,
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
                  onChange={e => { setInstagram(e.target.value.replace(/^@/, '')); setIgProfile(null) }}
                  onKeyDown={e => e.key === 'Enter' && lookupInstagram()}
                  className="w-full pl-8 pr-4 py-3 rounded-xl border text-sm bg-white text-[#1C2B3A] placeholder-[#9ca3af] transition-all outline-none border-black/10 focus:border-[#F5B800] focus:ring-2 focus:ring-[#F5B800]/20"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                />
              </div>
              <button
                type="button"
                onClick={lookupInstagram}
                disabled={looking || !instagram.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                style={{ background: '#1C2B3A', color: 'white', fontFamily: "'Inter', sans-serif" }}
              >
                {looking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Look up
              </button>
            </div>
            <p className="text-xs text-gray-400">Must be a public account</p>
          </div>

          {igProfile && (
            <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: 'rgba(107,230,176,0.08)', border: '1.5px solid rgba(107,230,176,0.3)' }}>
              {igProfile.profile_pic_url && (
                <img src={igProfile.profile_pic_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-[#1C2B3A]">{igProfile.full_name ?? `@${igProfile.username}`}</p>
                  {igProfile.is_verified && <ShieldCheck className="w-3.5 h-3.5 shrink-0" style={{ color: '#6BE6B0' }} />}
                </div>
                <p className="text-xs text-gray-500">
                  {igProfile.follower_count != null ? `${igProfile.follower_count.toLocaleString()} followers` : '@' + igProfile.username}
                  {igProfile.post_count != null ? ` · ${igProfile.post_count} posts` : ''}
                </p>
              </div>
              <Check className="w-4 h-4 shrink-0" style={{ color: '#6BE6B0' }} />
            </div>
          )}

          {!igProfile && (
            <div className="flex flex-col gap-1.5">
              <Input
                label="Follower count"
                type="number"
                placeholder="e.g. 2500"
                value={followerCount}
                onChange={e => setFollowerCount(e.target.value)}
                hint="Enter manually if look up didn't work"
              />
            </div>
          )}

          {belowThreshold && (
            <div className="flex items-start gap-2 rounded-xl px-3 py-2.5" style={{ background: 'rgba(245,184,0,0.08)', border: '1px solid rgba(245,184,0,0.25)' }}>
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#F5B800' }} />
              <p className="text-xs text-gray-600" style={{ fontFamily: "'Inter', sans-serif" }}>
                We typically work with creators with <strong>1,000+ followers</strong>. You can still sign up — we&apos;ll review your profile and be in touch.
              </p>
            </div>
          )}

          <Button onClick={saveStep1} loading={saving} disabled={!instagram.trim() || (!igProfile && !followerCount)}>Continue →</Button>
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
