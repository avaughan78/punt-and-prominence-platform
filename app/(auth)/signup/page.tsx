'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Building2, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { Role } from '@/lib/types'

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [role, setRole] = useState<Role | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)

  function handleRoleSelect(r: Role) {
    setRole(r)
    setStep(2)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!role) return
    setLoading(true)

    // Validate invite code first
    const supabase = createClient()
    const { data: codeRow, error: codeErr } = await supabase
      .from('invite_codes')
      .select('id, used')
      .eq('code', inviteCode.toUpperCase().trim())
      .single() as { data: { id: string; used: boolean } | null; error: unknown }

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
      // Mark invite code as used
      await (supabase
        .from('invite_codes') as ReturnType<typeof supabase.from>)
        .update({ used: true, used_by: data.user.id } as Record<string, unknown>)
        .eq('id', codeRow.id)

      router.push(role === 'business' ? '/business' : '/creator')
    }
  }

  return (
    <div className="w-full max-w-sm">
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
              <p className="text-xs text-white/50">Post offers and get matched with Cambridge creators</p>
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
            <Link href="/login" className="font-semibold text-[#1C2B3A]">Sign in</Link>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label={role === 'business' ? 'Business name' : 'Your name'}
            placeholder={role === 'business' ? 'The Mill Road Café' : 'Jane Smith'}
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
          <Input
            label="Password"
            type="password"
            placeholder="Min. 8 characters"
            value={password}
            onChange={e => setPassword(e.target.value)}
            minLength={8}
            required
          />
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
