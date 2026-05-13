'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Building2, Sparkles, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { Role } from '@/lib/types'

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  )
}

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<1 | 2>(1)
  const [role, setRole] = useState<Role | null>(null)

  useEffect(() => {
    const r = searchParams.get('role')
    if (r === 'business' || r === 'creator') {
      setRole(r)
      setStep(2)
    }
  }, [searchParams])
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)

  function handleRoleSelect(r: Role) {
    setRole(r)
    setStep(2)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!role) return
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.')
      return
    }
    setLoading(true)

    // Validate invite code first
    const supabase = createClient()
    const { data: codeRow, error: codeErr } = await supabase
      .from('invite_codes')
      .select('id, used, reusable')
      .eq('code', inviteCode.toUpperCase().trim())
      .single() as { data: { id: string; used: boolean; reusable: boolean } | null; error: unknown }

    if (codeErr || !codeRow) {
      toast.error('Invalid invite code. Contact hello@puntandprominence.co.uk to join.')
      setLoading(false)
      return
    }
    if (codeRow.used) {
      toast.error('This invite code has already been used.')
      setLoading(false)
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role, display_name: displayName },
      },
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      if (!codeRow.reusable) {
        await (supabase
          .from('invite_codes') as ReturnType<typeof supabase.from>)
          .update({ used: true, used_by: data.user.id } as Record<string, unknown>)
          .eq('id', codeRow.id)
      }

      // Fire welcome email (non-blocking)
      fetch('/api/auth/welcome', { method: 'POST' })

      router.push(role === 'business' ? '/business/onboarding' : '/creator/onboarding')
    }
  }

  return (
    <div className="w-full max-w-sm bg-white rounded-2xl p-8 shadow-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: '#1C2B3A' }}>
          {step === 1 ? 'Join Punt & Prominence' : 'Create your account'}
        </h1>
        <p className="text-sm text-gray-500">
          {step === 1
            ? 'Cambridge\'s local creator marketplace — currently by invite only.'
            : `Joining as a ${role === 'business' ? 'business' : 'creator'}.`}
        </p>
      </div>

      {step === 1 ? (
        <div className="flex flex-col gap-4">
          <button
            onClick={() => handleRoleSelect('business')}
            className="flex items-start gap-4 p-5 rounded-2xl text-left transition-all hover:-translate-y-0.5 hover:shadow-lg cursor-pointer"
            style={{ background: '#1C2B3A', border: '2px solid rgba(245,184,0,0.3)' }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245,184,0,0.15)' }}>
              <Building2 className="w-5 h-5" style={{ color: '#F5B800' }} />
            </div>
            <div>
              <p className="font-semibold text-white mb-0.5" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>I&apos;m a Business</p>
              <p className="text-xs text-white/50">Post collabs and get matched with Cambridge creators</p>
            </div>
          </button>

          <button
            onClick={() => handleRoleSelect('creator')}
            className="flex items-start gap-4 p-5 rounded-2xl text-left transition-all hover:-translate-y-0.5 hover:shadow-lg cursor-pointer"
            style={{ background: '#1C2B3A', border: '2px solid rgba(107,230,176,0.3)' }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(107,230,176,0.15)' }}>
              <Sparkles className="w-5 h-5" style={{ color: '#6BE6B0' }} />
            </div>
            <div>
              <p className="font-semibold text-white mb-0.5" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>I&apos;m a Creator</p>
              <p className="text-xs text-white/50">Browse and claim exclusive Cambridge offers</p>
            </div>
          </button>

          <p className="text-xs text-center text-gray-400 mt-2">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-[#1C2B3A] hover:underline">Sign in</Link>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Your name"
            placeholder="Jane Smith"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            required
          />
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#1C2B3A] uppercase tracking-wide" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                minLength={8}
                required
                className="w-full px-4 py-3 pr-10 rounded-xl border text-sm bg-white text-[#1C2B3A] placeholder-[#9ca3af] transition-all outline-none border-black/10 focus:border-[#F5B800] focus:ring-2 focus:ring-[#F5B800]/20"
                style={{ fontFamily: "'Inter', sans-serif" }}
              />
              <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#1C2B3A] uppercase tracking-wide" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Confirm password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                minLength={8}
                required
                className="w-full px-4 py-3 pr-10 rounded-xl border text-sm bg-white text-[#1C2B3A] placeholder-[#9ca3af] transition-all outline-none border-black/10 focus:border-[#F5B800] focus:ring-2 focus:ring-[#F5B800]/20"
                style={{ fontFamily: "'Inter', sans-serif" }}
              />
              <button type="button" onClick={() => setShowConfirmPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <Input
            label="Invite code"
            placeholder="e.g. CAMBRIDGE2025"
            value={inviteCode}
            onChange={e => setInviteCode(e.target.value)}
            hint="Need a code? Email hello@puntandprominence.co.uk"
            required
          />

          <div className="flex gap-3 mt-2">
            <Button type="button" variant="ghost" onClick={() => setStep(1)} className="flex-1">
              Back
            </Button>
            <Button type="submit" loading={loading} className="flex-1">
              Create account
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
