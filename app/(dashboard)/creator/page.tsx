import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StatCard } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Search } from 'lucide-react'

export default async function CreatorDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ count: totalOffers }, { data: matches }] = await Promise.all([
    supabase.from('offers').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('matches').select('id, status').eq('creator_id', user!.id),
  ])

  const active = matches?.filter(m => ['pending','visited','posted'].includes(m.status)).length ?? 0
  const verified = matches?.filter(m => m.status === 'verified').length ?? 0

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Browse Cambridge offers and manage your matches.</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8">
        <StatCard label="Available offers" value={totalOffers ?? 0} />
        <StatCard label="Active matches" value={active} accent="#C084FC" />
        <StatCard label="Verified" value={verified} accent="#22c55e" />
      </div>

      <div className="rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4"
        style={{ background: 'linear-gradient(135deg, #1C2B3A 0%, #253d54 100%)' }}>
        <div className="flex-1">
          <p className="font-semibold text-white mb-1" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            {(totalOffers ?? 0) > 0 ? `${totalOffers} offers available` : 'New invites coming soon'}
          </p>
          <p className="text-xs text-white/50">Cambridge businesses are waiting for creators like you.</p>
        </div>
        <Link href="/creator/browse">
          <Button>
            <Search className="w-4 h-4" />
            Browse offers
          </Button>
        </Link>
      </div>
    </div>
  )
}
