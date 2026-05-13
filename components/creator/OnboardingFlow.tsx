'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { SocialHandleInput } from '@/components/ui/SocialHandleInput'

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
}

function ProfileCard({ data, platform }: { data: LookupData; platform: 'instagram' | 'tiktok' }) {
  const initials = data.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) ?? '?'
  return (
    <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: 'rgba(107,230,176,0.08)', border: '1px solid rgba(107,230,176,0.3)' }}>
      <div className="relative shrink-0">
        <div className="w-12 h-12 rounded-full overflow-hidden" style={{ background: 'linear-gradient(135deg, #1C2B3A, #6BE6B0)' }}>
          {data.image
            ? <img src={data.image} alt="" className="w-full h-full object-cover" />
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
            {data.name ?? `@${data.handle}`}
          </p>
          {data.verified && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0" style={{ background: 'rgba(245,184,0,0.15)', color: '#b45309', fontFamily: "'JetBrains Mono', monospace" }}>
              VERIFIED
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500">@{data.handle}{platform === 'tiktok' ? ' · TikTok' : ''}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
          {data.followers != null ? data.followers.toLocaleString() : '—'}
        </p>
        <p className="text-[10px] text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>followers</p>
      </div>
    </div>
  )
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex items-start gap-3 rounded-xl px-4 py-3" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
      <p className="text-xs text-red-600 flex-1">{message}</p>
      <button type="button" onClick={onRetry} className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700 shrink-0">
        <RefreshCw className="w-3 h-3" /> Retry
      </button>
    </div>
  )
}

export function CreatorOnboardingFlow({ userId, contactName, initialAvatarUrl: _ }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  // Instagram
  const [instagram, setInstagram] = useState('')
  const [igLooking, setIgLooking] = useState(false)
  const [igData, setIgData] = useState<LookupData | null>(null)
  const [igError, setIgError] = useState<string | null>(null)
  const [followerCount, setFollowerCount] = useState('')

  // TikTok
  const [tiktok, setTiktok] = useState('')
  const [ttLooking, setTtLooking] = useState(false)
  const [ttData, setTtData] = useState<LookupData | null>(null)
  const [ttError, setTtError] = useState<string | null>(null)

  // Bio / website — auto-filled from lookups, editable as fallback
  const [bio, setBio] = useState('')
  const [website, setWebsite] = useState('')

  const igFollowers = parseInt(followerCount.replace(/,/g, ''), 10)
  const belowThreshold = followerCount !== '' && !isNaN(igFollowers) && igFollowers < FOLLOWER_MIN

  async function lookupInstagram() {
    const clean = instagram.replace(/^@/, '').trim()
    if (!clean) return
    setIgLooking(true)
    setIgData(null)
    setIgError(null)
    try {
      const res = await fetch(`/api/instagram/lookup?handle=${encodeURIComponent(clean)}&userId=${encodeURIComponent(userId)}`)
      const data = await res.json()
      if (!res.ok) { setIgError(data.error ?? 'Profile not found — check the handle is correct and the account is public'); return }
      if (data.isPrivate) { setIgError('This account is private — it must be public to sign up'); return }
      if (data.followers != null) setFollowerCount(String(data.followers))
      if (data.bio) setBio(data.bio)
      if (data.website) setWebsite(data.website)
      if (data.image) await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ avatar_url: data.image }) })
      setIgData({ handle: data.handle, name: data.name, image: data.image, followers: data.followers, verified: data.verified })
    } finally {
      setIgLooking(false)
    }
  }

  async function lookupTiktok() {
    const clean = tiktok.replace(/^@/, '').trim()
    if (!clean) return
    setTtLooking(true)
    setTtData(null)
    setTtError(null)
    try {
      const noIgPhoto = !igData?.image
      const res = await fetch(`/api/tiktok/lookup?handle=${encodeURIComponent(clean)}&userId=${encodeURIComponent(userId)}&cachePhoto=${noIgPhoto}`)
      const data = await res.json()
      if (!res.ok) { setTtError(data.error ?? 'Profile not found — check the handle and try again'); return }
      if (data.isPrivate) { setTtError('This account is private — it must be public to verify'); return }
      if (!bio && data.bio) setBio(data.bio)
      if (!website && data.website) setWebsite(data.website)
      if (noIgPhoto && data.image) await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ avatar_url: data.image }) })
      setTtData({ handle: data.handle, name: data.name, image: data.image, followers: data.followers, verified: data.verified })
    } finally {
      setTtLooking(false)
    }
  }

  async function saveStep1() {
    if (!instagram.trim()) { toast.error('Please enter your Instagram handle'); return }
    if (!igData && !followerCount.trim()) { toast.error('Please enter your follower count'); return }
    const count = parseInt(followerCount.replace(/,/g, ''), 10)
    setSaving(true)
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instagram_handle: instagram.replace(/^@/, ''),
        follower_count: isNaN(count) ? null : count,
        // Approve if verified by API, or if manually entered count meets threshold
        is_approved: igData ? true : (isNaN(count) || count >= FOLLOWER_MIN),
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
        tiktok_follower_count: ttData?.followers ?? null,
      }),
    })
    setSaving(false)
    if (!res.ok) { toast.error('Failed to save'); return }
    setStep(2)
  }

  // How much we know after step 1 — determines what step 2 needs to ask
  const haveEverything = igData && bio && website

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
            <p className="text-sm text-gray-500">
              {igData ? 'Looking good — hit Continue when you\'re ready.' : 'Enter your handle and tap ✓ to verify.'}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#1C2B3A] uppercase tracking-wide" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Instagram handle
            </label>
            <SocialHandleInput
              platform="instagram"
              value={instagram}
              onChange={v => { setInstagram(v); setIgData(null); setIgError(null) }}
              onVerify={lookupInstagram}
              looking={igLooking}
              verified={!!igData}
            />
            {!igData && !igError && <p className="text-xs text-gray-400">Must be a public account</p>}
          </div>

          {igData && <ProfileCard data={igData} platform="instagram" />}
          {igError && <ErrorBanner message={igError} onRetry={lookupInstagram} />}

          {/* Manual follower count — only shown if lookup failed */}
          {igError && (
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
                  <p className="text-xs text-gray-600">
                    We typically work with creators with <strong>1,000+ followers</strong>. You can still sign up — we&apos;ll review your profile and be in touch.
                  </p>
                </div>
              )}
            </div>
          )}

          <Button onClick={saveStep1} loading={saving} disabled={igLooking || (!igData && !igError)}>
            {!igData && !igError && !igLooking ? 'Verify your handle above →' : 'Continue →'}
          </Button>
          {igError && (
            <button type="button" onClick={saveStep1} className="text-xs text-center text-gray-400 hover:text-gray-600 -mt-2">
              Skip verification and continue anyway
            </button>
          )}
        </div>
      )}

      {/* Step 2 — TikTok + extras */}
      {step === 1 && (
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="text-xl font-bold text-[#1C2B3A] mb-1" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              {haveEverything ? 'Almost there!' : 'A bit more about you'}
            </h2>
            <p className="text-sm text-gray-500">
              {haveEverything
                ? 'Add your TikTok if you have one — otherwise just continue.'
                : 'All fields are optional.'}
            </p>
          </div>

          {/* TikTok */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#1C2B3A] uppercase tracking-wide" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              TikTok handle <span className="text-gray-400 normal-case font-normal">· optional</span>
            </label>
            <SocialHandleInput
              platform="tiktok"
              value={tiktok}
              onChange={v => { setTiktok(v); setTtData(null); setTtError(null) }}
              onVerify={lookupTiktok}
              looking={ttLooking}
              verified={!!ttData}
              placeholder="yourtiktok"
            />
          </div>

          {ttData && <ProfileCard data={ttData} platform="tiktok" />}
          {ttError && <ErrorBanner message={ttError} onRetry={lookupTiktok} />}

          {/* Bio — only show if not already populated */}
          {!bio && (
            <Textarea
              label="Bio"
              placeholder="Food and lifestyle creator based in Cambridge. I shoot warm, editorial content and love supporting independent businesses…"
              rows={4}
              value={bio}
              onChange={e => setBio(e.target.value)}
            />
          )}

          {/* Website — only show if not already populated */}
          {!website && (
            <Input
              label="Website or link in bio"
              type="url"
              placeholder="https://yoursite.com"
              value={website}
              onChange={e => setWebsite(e.target.value)}
            />
          )}

          {/* Show a compact summary if bio/website were auto-filled */}
          {(bio || website) && (
            <div className="rounded-xl px-4 py-3 flex flex-col gap-1" style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.06)' }}>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Pulled from your profile</p>
              {bio && <p className="text-xs text-gray-600 line-clamp-2">{bio}</p>}
              {website && <p className="text-xs text-gray-400">{website}</p>}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setStep(0)}>Back</Button>
            <Button onClick={saveStep2} loading={saving} className="flex-1">Continue →</Button>
          </div>
        </div>
      )}

      {/* Step 3 — Done */}
      {step === 2 && (
        <div className="flex flex-col items-center text-center gap-6 py-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1C2B3A, #6BE6B0)' }}>
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
          <Button onClick={() => router.push('/creator/browse')}>Browse invites</Button>
        </div>
      )}
    </div>
  )
}
