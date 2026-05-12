import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const adminEmail = process.env.ADMIN_EMAIL

  if (!adminEmail || !user || user.email !== adminEmail) {
    redirect('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-[#1C2B3A] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="text-xs font-semibold tracking-widest text-[#F5B800]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            ★ ADMIN
          </span>
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-xs text-white/60 hover:text-white transition-colors">Overview</Link>
            <Link href="/admin/creators" className="text-xs text-white/60 hover:text-white transition-colors">Creators</Link>
            <Link href="/admin/businesses" className="text-xs text-white/60 hover:text-white transition-colors">Businesses</Link>
            <Link href="/admin/invite-codes" className="text-xs text-white/60 hover:text-white transition-colors">Invite codes</Link>
          </div>
        </div>
        <span className="text-xs text-white/30">{user.email}</span>
      </nav>
      <main className="max-w-6xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
