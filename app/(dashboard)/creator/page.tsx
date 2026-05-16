import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StatCard } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Search, AlertCircle, Clock, MessageCircle } from 'lucide-react'

export default async function CreatorDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: invites }, { data: matches }, { data: unreadCount }] = await Promise.all([
    supabase.from('profiles').select('instagram_handle, is_approved').eq('id', user!.id).single(),
    supabase.from('offers').select('id, slots_total, slots_claimed').eq('is_active', true),
    supabase.from('matches').select('id, offer_id, status, scan_count').eq('creator_id', user!.id),
    supabase.rpc('get_unread_message_count'),
  ])

  if (!profile?.instagram_handle) redirect('/creator/onboarding')

  const claimedOfferIds  = new Set((matches ?? []).map(m => m.offer_id).filter(Boolean))
  const availableInvites = (invites ?? []).filter(o => o.slots_claimed < o.slots_total && !claimedOfferIds.has(o.id)).length
  const inProgress = matches?.filter(m => ['accepted', 'posted', 'active'].includes(m.status)).length ?? 0
  const completed  = matches?.filter(m => ['verified', 'completed'].includes(m.status)).length ?? 0
  const visits     = matches?.filter(m => (m.scan_count ?? 0) > 0).length ?? 0

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Browse Cambridge collabs and manage your matches.</p>
      </div>

      {/* Unread messages banner */}
      {(unreadCount ?? 0) > 0 && (
        <Link href="/creator/matches?filter=unread">
          <div className="flex items-center gap-3 rounded-2xl px-4 py-3 mb-4 cursor-pointer hover:opacity-90 transition-opacity" style={{ background: 'rgba(245,184,0,0.1)', border: '1.5px solid rgba(245,184,0,0.3)' }}>
            <MessageCircle className="w-4 h-4 shrink-0" style={{ color: '#F5B800' }} />
            <p className="text-sm text-[#1C2B3A] flex-1" style={{ fontFamily: "'Inter', sans-serif" }}>
              <span className="font-semibold">
                {unreadCount} unread message{(unreadCount ?? 0) !== 1 ? 's' : ''}
              </span>{' '}from a business
            </p>
            <span className="text-xs font-semibold text-[#F5B800] shrink-0">View →</span>
          </div>
        </Link>
      )}

      {profile?.is_approved === false && (
        <div className="flex items-start gap-3 rounded-2xl px-4 py-4 mb-6" style={{ background: 'rgba(245,184,0,0.08)', border: '1.5px solid rgba(245,184,0,0.25)' }}>
          <Clock className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#F5B800' }} />
          <div>
            <p className="text-sm font-semibold text-[#1C2B3A] mb-0.5" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              Your profile is under review
            </p>
            <p className="text-xs text-gray-500" style={{ fontFamily: "'Inter', sans-serif" }}>
              We aim to review within 48 hours and will email you when approved. You can browse collabs in the meantime — claiming will be unlocked once you&apos;re approved. Questions? <a href="mailto:hello@puntandprominence.co.uk" className="underline text-[#1C2B3A] font-medium">Get in touch.</a>
            </p>
          </div>
        </div>
      )}

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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard label="Available collabs" value={availableInvites} href="/creator/browse" />
        <StatCard label="In progress" value={inProgress} accent="#C084FC" href="/creator/matches?filter=in_progress" />
        <StatCard label="Completed" value={completed} accent="#22c55e" href="/creator/matches?filter=done" />
        <StatCard label="Visits confirmed" value={visits} accent="#6BE6B0" href="/creator/matches?filter=visited" />
      </div>

      <div className="rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4"
        style={{ border: '1.5px solid transparent', background: 'linear-gradient(#f9f6ff, #fff8f6) padding-box, linear-gradient(135deg, rgba(131,58,180,0.35) 0%, rgba(253,29,29,0.25) 60%, rgba(252,176,69,0.2) 100%) border-box' }}>
        <div className="flex-1">
          <p className="font-semibold text-[#1C2B3A] mb-1" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            {availableInvites > 0 ? `${availableInvites} collab${availableInvites !== 1 ? 's' : ''} available` : 'New collabs coming soon'}
          </p>
          <p className="text-xs text-gray-400">Cambridge businesses are waiting for creators like you.</p>
        </div>
        <Link href="/creator/browse">
          <Button>
            <Search className="w-4 h-4" />
            Browse collabs
          </Button>
        </Link>
      </div>
    </div>
  )
}
