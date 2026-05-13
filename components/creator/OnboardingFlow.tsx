'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, Camera, Loader2, BadgeCheck, AlertTriangle } from 'lucide-react'
import Script from 'next/script'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { createClient } from '@/lib/supabase/client'

const STEPS = ['Connect Instagram', 'About you', 'All set!']

interface Props {
  userId: string
  contactName: string
  initialAvatarUrl: string | null
}

interface VerifiedData {
  instagram_handle: string | null
  follower_count: number | null
  engagement_rate: number | null
  audience_local_pct: number | null
  audience_local_label: 'cambridge' | 'uk' | null
}

declare global {
  interface Window {
    PhylloConnect: {
      initialize: (config: Record<string, unknown>) => { open: () => void }
    }
  }
}

export function CreatorOnboardingFlow({ userId, contactName, initialAvatarUrl }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? '')

  // Phyllo state
  const [phylloLoaded, setPhylloLoaded] = useState(false)
  const [phylloLoading, setPhylloLoading] = useState(false)
  const [verified, setVerified] = useState<VerifiedData | null>(null)

  // Step 2 fields
  const [bio, setBio] = useState('')
  const [website, setWebsite] = useState('')

  const initials = contactName
    ? contactName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

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

  async function openPhylloConnect() {
    if (!phylloLoaded) { toast.error('Still loading — try again in a moment'); return }
    setPhylloLoading(true)
    try {
      const res = await fetch('/api/phyllo/sdk-token', { method: 'POST' })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'Failed to get token')

      const connect = window.PhylloConnect.initialize({
        clientDisplayName: 'Punt & Prominence',
        environment: process.env.NEXT_PUBLIC_PHYLLO_ENV ?? 'sandbox',
        userId: body.phyllo_user_id,
        token: body.sdk_token,
        singleAccount: true,
        accountConnected: async (accountId: string) => {
          try {
            const dataRes = await fetch('/api/phyllo/fetch-data', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ account_id: accountId }),
            })
            const data = await dataRes.json()
            if (!dataRes.ok) throw new Error(data.error ?? 'Failed to fetch data')
            setVerified(data)
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Could not fetch Instagram data')
          }
        },
        exit: () => setPhylloLoading(false),
        connectionFailure: () => {
          toast.error('Instagram connection failed — please try again')
          setPhylloLoading(false)
        },
      })
      connect.open()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not open connection')
    }
    setPhylloLoading(false)
  }

  async function saveStep2() {
    setSaving(true)
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bio: bio || null, website_url: website || null }),
    })
    setSaving(false)
    if (!res.ok) { toast.error('Failed to save'); return }
    setStep(2)
  }

  function formatFollowers(n: number | null) {
    if (n == null) return '—'
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
    return String(n)
  }

  return (
    <>
      <Script
        src="https://cdn.getphyllo.com/connect/v2/phyllo-connect.js"
        onLoad={() => setPhylloLoaded(true)}
      />

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

        {/* Step 1 — Connect Instagram */}
        {step === 0 && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-bold text-[#1C2B3A] mb-1" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                Connect your Instagram, {contactName.split(' ')[0]}
              </h2>
              <p className="text-sm text-gray-500">We use Phyllo to securely verify your account. We only read public stats — we can never post or message on your behalf.</p>
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

            {/* Verified data card */}
            {verified ? (
              <div className="rounded-2xl p-5 flex flex-col gap-4" style={{ background: 'rgba(107,230,176,0.06)', border: '1px solid rgba(107,230,176,0.3)' }}>
                <div className="flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4" style={{ color: '#6BE6B0' }} />
                  <span className="text-sm font-semibold text-[#1C2B3A]">Instagram verified</span>
                  {verified.instagram_handle && (
                    <span className="text-xs text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>@{verified.instagram_handle}</span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Followers', value: formatFollowers(verified.follower_count) },
                    { label: 'Eng. rate', value: verified.engagement_rate != null ? `${verified.engagement_rate}%` : '—' },
                    {
                      label: verified.audience_local_label === 'cambridge' ? 'Cambridge' : 'UK audience',
                      value: verified.audience_local_pct != null ? `${verified.audience_local_pct}%` : '—',
                    },
                  ].map(s => (
                    <div key={s.label} className="flex flex-col items-center rounded-xl py-3" style={{ background: 'rgba(255,255,255,0.6)' }}>
                      <span className="text-base font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>{s.value}</span>
                      <span className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{s.label}</span>
                    </div>
                  ))}
                </div>
                {(verified.follower_count ?? 0) < 1000 && (
                  <div className="flex items-start gap-2 rounded-xl px-3 py-2.5" style={{ background: 'rgba(245,184,0,0.08)', border: '1px solid rgba(245,184,0,0.25)' }}>
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#F5B800' }} />
                    <p className="text-xs text-gray-600">We typically work with creators with <strong>1,000+ followers</strong>. We'll review your profile and be in touch.</p>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={openPhylloConnect}
                disabled={phylloLoading}
                className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)', color: '#fff', fontFamily: "'Inter', sans-serif" }}
              >
                {phylloLoading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Connecting…</>
                  : <>Connect Instagram</>
                }
              </button>
            )}

            <Button onClick={() => setStep(1)} disabled={!verified}>
              Continue →
            </Button>
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
            <Button onClick={() => router.push('/creator/browse')}>Browse invites</Button>
          </div>
        )}
      </div>
    </>
  )
}
