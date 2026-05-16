import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'

export default async function VerifyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('matches')
    .select(`
      punt_code,
      status,
      invite:offers(
        title,
        invite_type,
        business:profiles!offers_business_id_fkey(business_name, display_name)
      ),
      creator:profiles!matches_creator_id_fkey(display_name, instagram_handle, avatar_url)
    `)
    .eq('punt_code', code.toUpperCase())
    .single()

  if (!data) notFound()

  const creator = data.creator as unknown as { display_name: string; instagram_handle: string | null; avatar_url: string | null } | null
  const invite  = data.invite  as unknown as { title: string; invite_type: string; business: { business_name: string | null; display_name: string } | null } | null
  const biz     = invite?.business
  const bizName = biz?.business_name ?? biz?.display_name ?? ''
  const initial = creator?.display_name?.[0]?.toUpperCase() ?? '?'

  const isActive = !['verified', 'completed'].includes(data.status)

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
      <div className="w-full max-w-xs">

        {/* Pass card */}
        <div className="bg-white rounded-3xl overflow-hidden" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.12)', border: '1.5px solid transparent', background: 'linear-gradient(#ffffff, #ffffff) padding-box, linear-gradient(90deg, #833ab4, #fd1d1d, #fcb045) border-box' }}>

          {/* Header */}
          <div className="px-6 pt-6 pb-4 text-center" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-3"
              style={{ background: isActive ? 'rgba(107,230,176,0.15)' : 'rgba(148,163,184,0.15)', border: `1px solid ${isActive ? 'rgba(107,230,176,0.35)' : 'rgba(148,163,184,0.35)'}` }}>
              <CheckCircle2 className="w-3 h-3" style={{ color: isActive ? '#16a34a' : '#64748b' }} />
              <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: isActive ? '#16a34a' : '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>
                {isActive ? 'Valid collab pass' : 'Collab complete'}
              </span>
            </div>
            <p className="font-bold text-[#1C2B3A] leading-snug" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              {invite?.title ?? 'Collab'}
            </p>
            {bizName && (
              <p className="text-sm text-gray-400 mt-0.5">at {bizName}</p>
            )}
          </div>

          {/* Creator identity */}
          <div className="flex flex-col items-center gap-3 px-6 py-6">
            {creator?.avatar_url ? (
              <img
                src={creator.avatar_url}
                alt={creator.display_name}
                className="w-24 h-24 rounded-full object-cover"
                style={{ border: '3px solid #6BE6B0' }}
              />
            ) : (
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #1C2B3A, #6BE6B0)' }}
              >
                {initial}
              </div>
            )}
            <div className="text-center">
              <p className="font-bold text-lg text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                {creator?.display_name}
              </p>
              {creator?.instagram_handle && (
                <p className="text-sm text-gray-400 mt-0.5">@{creator.instagram_handle}</p>
              )}
            </div>
          </div>

          {/* Punt code */}
          <div className="mx-4 mb-6 rounded-2xl px-4 py-3 text-center" style={{ background: 'rgba(245,184,0,0.06)', border: '1.5px solid rgba(245,184,0,0.2)' }}>
            <p className="text-[10px] mb-1 uppercase tracking-widest font-bold" style={{ color: '#b45309', fontFamily: "'JetBrains Mono', monospace" }}>
              Punt code
            </p>
            <p className="text-2xl font-bold tracking-widest" style={{ color: '#1C2B3A', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.15em' }}>
              {data.punt_code}
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4" style={{ fontFamily: "'Inter', sans-serif" }}>
          Punt &amp; Prominence · Cambridge collabs
        </p>
      </div>
    </div>
  )
}
