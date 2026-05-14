'use client'
import { useEffect, useState } from 'react'
import { formatGBP } from '@/lib/utils'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface Invite {
  id: string
  title: string
  description: string | null
  requirements: string | null
  category: string | null
  invite_type: 'one_off' | 'retainer' | null
  value_gbp: number | null
  fee_gbp: number | null
  posts_per_month: number | null
  duration_months: number | null
  slots_total: number
  slots_claimed: number
  is_active: boolean
  expires_at: string | null
  created_at: string
  business: {
    id: string
    business_name: string | null
    display_name: string
    avatar_url: string | null
    instagram_handle: string | null
    website_url: string | null
    address_line: string | null
  } | null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AdminInvites() {
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'claimed'>('active')
  const [expanded, setExpanded] = useState<string | null>(null)

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
            const value = isRetainer ? inv.fee_gbp : inv.value_gbp
            const isExpanded = expanded === inv.id
            const isLast = i === filtered.length - 1
            const slotsFull = inv.slots_claimed >= inv.slots_total
            const slotsOpen = inv.slots_total - inv.slots_claimed
            const slotPct = Math.round((inv.slots_claimed / Math.max(inv.slots_total, 1)) * 100)

            return (
              <div
                key={inv.id}
                style={{ borderBottom: (!isLast || isExpanded) ? '1px solid rgba(0,0,0,0.06)' : 'none' }}
              >
                {/* Main row */}
                <div className="flex items-center gap-4 px-4 py-3">
                  {biz?.avatar_url ? (
                    <img src={biz.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-100 shrink-0 flex items-center justify-center text-xs font-bold text-gray-400">
                      {bizName[0]?.toUpperCase()}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-[#1C2B3A] truncate">{inv.title}</p>
                      {isRetainer && (
                        <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded shrink-0" style={{ background: 'rgba(192,132,252,0.12)', color: '#9333ea', fontFamily: "'JetBrains Mono', monospace" }}>
                          retainer
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      {bizName}
                      {inv.category ? ` · ${inv.category}` : ''}
                      {value != null ? ` · ${formatGBP(value)}${isRetainer ? '/mo' : ''}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {/* Slot count */}
                    <span className="text-xs font-semibold hidden sm:block" style={{ color: slotsFull ? '#6b7280' : '#F5B800', fontFamily: "'JetBrains Mono', monospace" }}>
                      {inv.slots_claimed}/{inv.slots_total}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${inv.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                      {inv.is_active ? 'active' : 'claimed'}
                    </span>
                    <button
                      onClick={() => setExpanded(prev => prev === inv.id ? null : inv.id)}
                      className="p-1 rounded-lg text-gray-300 hover:text-gray-500 transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded drawer */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1" style={{ background: 'rgba(0,0,0,0.015)' }}>
                    <div className="grid grid-cols-2 gap-3 mb-3">

                      {/* Offer details */}
                      <div className="rounded-xl bg-white p-3 flex flex-col gap-2.5" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Offer</p>

                        {inv.description && (
                          <div>
                            <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">Description</p>
                            <p className="text-xs text-gray-600 leading-relaxed">{inv.description}</p>
                          </div>
                        )}

                        {inv.requirements && (
                          <div>
                            <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">Requirements</p>
                            <p className="text-xs text-gray-600 leading-relaxed">{inv.requirements}</p>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                          {value != null && (
                            <div>
                              <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">Value</p>
                              <p className="text-xs font-semibold text-[#1C2B3A]">{formatGBP(value)}{isRetainer ? '/mo' : ''}</p>
                            </div>
                          )}
                          {isRetainer && inv.posts_per_month != null && (
                            <div>
                              <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">Posts</p>
                              <p className="text-xs font-semibold text-[#1C2B3A]">{inv.posts_per_month}/mo</p>
                            </div>
                          )}
                          {isRetainer && inv.duration_months != null && (
                            <div>
                              <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">Duration</p>
                              <p className="text-xs font-semibold text-[#1C2B3A]">{inv.duration_months} months</p>
                            </div>
                          )}
                          {inv.expires_at && (
                            <div>
                              <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">Expires</p>
                              <p className="text-xs font-semibold text-[#1C2B3A]">{formatDate(inv.expires_at)}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">Created</p>
                            <p className="text-xs text-gray-600">{formatDate(inv.created_at)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Slots + business */}
                      <div className="rounded-xl bg-white p-3 flex flex-col gap-2.5" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Slots</p>

                        <div>
                          <div className="flex items-baseline justify-between mb-1.5">
                            <span className="text-2xl font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>{inv.slots_claimed}</span>
                            <span className="text-xs text-gray-400">of {inv.slots_total} claimed</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${slotPct}%`, background: slotsFull ? '#22c55e' : '#F5B800' }}
                            />
                          </div>
                          {slotsOpen > 0 && inv.is_active && (
                            <p className="text-[10px] text-gray-400 mt-1">{slotsOpen} slot{slotsOpen !== 1 ? 's' : ''} still open</p>
                          )}
                        </div>

                        <div className="border-t border-black/5 pt-2">
                          <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">Business</p>
                          <p className="text-xs font-semibold text-[#1C2B3A]">{bizName}</p>
                          {biz?.address_line && <p className="text-xs text-gray-400">{biz.address_line}</p>}
                          <div className="flex gap-3 mt-1.5">
                            {biz?.instagram_handle && (
                              <a href={`https://instagram.com/${biz.instagram_handle}`} target="_blank" rel="noopener noreferrer"
                                className="text-[10px] font-semibold text-gray-400 hover:text-gray-600 transition-colors">
                                Instagram ↗
                              </a>
                            )}
                            {biz?.website_url && (
                              <a href={biz.website_url} target="_blank" rel="noopener noreferrer"
                                className="text-[10px] font-semibold text-gray-400 hover:text-gray-600 transition-colors">
                                Website ↗
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
