'use client'
import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }
    const role = data.user?.user_metadata?.role
    const next = searchParams.get('next')
    if (next && next.startsWith(`/${role}`)) {
      router.push(next)
    } else {
      router.push(role === 'business' ? '/business' : '/creator')
    }
  }

  return (
    <div className="w-full max-w-sm bg-white rounded-2xl p-8 shadow-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: '#1C2B3A' }}>
          Welcome back
        </h1>
        <p className="text-sm text-gray-500">Sign in to your Punt &amp; Prominence account.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <div className="flex flex-col gap-1">
          <Input
            label="Password"
            type="password"
            showPasswordToggle
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-xs text-gray-400 hover:text-[#1C2B3A] transition-colors">
              Forgot password?
            </Link>
          </div>
        </div>
        <Button type="submit" loading={loading} size="lg" className="w-full mt-2">
          Sign in
        </Button>
      </form>

      <p className="text-sm text-center text-gray-500 mt-6">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="font-semibold" style={{ color: '#1C2B3A' }}>
          Sign up
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-sm h-64 animate-pulse bg-white/10 rounded-2xl" />}>
      <LoginForm />
    </Suspense>
  )
}
