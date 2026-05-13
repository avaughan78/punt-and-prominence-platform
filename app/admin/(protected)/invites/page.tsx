'use client'
import { useEffect, useState } from 'react'
import { formatGBP } from '@/lib/utils'

interface Invite {
  id: string
  title: string
  invite_type: 'one_off' | 'retainer' | null
  value_gbp: number | null
  fee_gbp: number | null
  posts_per_month: number | null
  duration_months: number | null
  is_active: boolean
  created_at: string
  business: { business_name: string | null; display_name: string; avatar_url: string | null } | null
}

export default function AdminInvites() {
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'claimed'>('active')

  useEffect(() => {
    fetch('/api/admin/invites')
      .then(r => r.json())
      .then(d => { setInvites(Array.isArray(d) ? d : []); setLoading(false) })
  }, [])

  const filtered = invites.filter(inv => {
    if (filter === 'active') return inv.is_active
    if (filter === 'claimed') return !inv.is_active
    return true
  })

  const activeCount = invites.filter(i => i.is_active).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Collabs</h1>
          <p className="text-sm text-gray-500 mt-0.5">{activeCount} active across all businesses</p>
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'claimed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors capitalize"
              style={{
                background: filter === f ? '#1C2B3A' : 'white',
                color: filter === f ? 'white' : '#6b7280',
                border: '1px solid rgba(0,0,0,0.1)',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : !filtered.length ? (
        <p className="text-sm text-gray-400">No collabs found.</p>
      ) : (
        <div className="rounded-2xl overflow-hidden bg-white" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
          {filtered.map((inv, i) => {
            const biz = inv.business
            const bizName = biz?.business_name ?? biz?.display_name ?? '—'
            const isRetainer = inv.invite_type === 'retainer'
            return (
              <div key={inv.id} className="flex items-center gap-4 px-4 py-3" style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                {biz?.avatar_url ? (
                  <img src={biz.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-100 shrink-0 flex items-center justify-center text-xs font-bold text-gray-400">
                    {bizName[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[#1C2B3A] truncate">{inv.title}</p>
                    {isRetainer && (
                      <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded" style={{ background: 'rgba(192,132,252,0.12)', color: '#9333ea', fontFamily: "'JetBrains Mono', monospace" }}>
                        retainer
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">{bizName}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-semibold" style={{ color: '#F5B800', fontFamily: "'JetBrains Mono', monospace" }}>
                    {isRetainer
                      ? inv.fee_gbp != null ? `${formatGBP(inv.fee_gbp)}/mo` : '—'
                      : inv.value_gbp != null ? formatGBP(inv.value_gbp) : '—'}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${inv.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                    {inv.is_active ? 'active' : 'claimed'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
