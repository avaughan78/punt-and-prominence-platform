'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    if (password !== confirm) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error, data } = await supabase.auth.updateUser({ password })
    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }
    toast.success('Password updated — signing you in')
    const role = data.user?.user_metadata?.role
    router.push(role === 'business' ? '/business' : '/creator')
  }

  return (
    <div className="w-full max-w-sm bg-white rounded-2xl p-8 shadow-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: '#1C2B3A' }}>
          Choose a new password
        </h1>
        <p className="text-sm text-gray-500">At least 8 characters.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="New password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <Input
          label="Confirm password"
          type="password"
          placeholder="••••••••"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          required
        />
        <Button type="submit" loading={loading} size="lg" className="w-full mt-2">
          Set new password
        </Button>
      </form>
    </div>
  )
}
