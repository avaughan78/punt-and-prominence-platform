import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StatCard } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Search, AlertCircle } from 'lucide-react'

export default async function CreatorDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: invites }, { data: matches }] = await Promise.all([
    supabase.from('profiles').select('instagram_handle').eq('id', user!.id).single(),
    supabase.from('offers').select('slots_total, slots_claimed').eq('is_active', true),
    supabase.from('matches').select('id, status').eq('creator_id', user!.id),
  ])

  // Count invites that still have slots available
  const availableInvites = (invites ?? []).filter(o => o.slots_claimed < o.slots_total).length
  const active = matches?.filter(m => ['pending','posted'].includes(m.status)).length ?? 0
  const verified = matches?.filter(m => m.status === 'verified').length ?? 0

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Browse Cambridge invites and manage your matches.</p>
      </div>

      {!profile?.instagram_handle && (
        <Link href="/creator/onboarding">
          <div className="flex items-center gap-3 rounded-2xl px-4 py-3 mb-6 cursor-pointer hover:opacity-90 transition-opacity" style={{ background: 'rgba(245,184,0,0.1)', border: '1.5px solid rgba(245,184,0,0.3)' }}>
            <AlertCircle className="w-4 h-4 shrink-0" style={{ color: '#F5B800' }} />
            <p className="text-sm text-[#1C2B3A] flex-1" style={{ fontFamily: "'Inter', sans-serif" }}>
              <span className="font-semibold">Complete your creator profile</span> — businesses want to see your Instagram before matching with you.
            </p>
            <span className="text-xs font-semibold text-[#F5B800] shrink-0">Set up →</span>
          </div>
        </Link>
      )}

      <div className="grid grid-cols-3 gap-3 mb-8">
        <StatCard label="Available invites" value={availableInvites} href="/creator/browse" />
        <StatCard label="Active matches" value={active} accent="#C084FC" href="/creator/matches" />
        <StatCard label="Verified" value={verified} accent="#22c55e" href="/creator/matches" />
      </div>

      <div className="rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4"
        style={{ background: 'linear-gradient(135deg, #1C2B3A 0%, #253d54 100%)' }}>
        <div className="flex-1">
          <p className="font-semibold text-white mb-1" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            {availableInvites > 0 ? `${availableInvites} invite${availableInvites !== 1 ? 's' : ''} available` : 'New invites coming soon'}
          </p>
          <p className="text-xs text-white/50">Cambridge businesses are waiting for creators like you.</p>
        </div>
        <Link href="/creator/browse">
          <Button>
            <Search className="w-4 h-4" />
            Browse invites
          </Button>
        </Link>
      </div>
    </div>
  )
}
