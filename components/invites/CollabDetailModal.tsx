'use client'
import { X, Users, Calendar, QrCode, FileCheck, CheckCircle2 } from 'lucide-react'
import { CategoryBadge } from '@/components/ui/Badge'
import { formatGBP, formatDate } from '@/lib/utils'
import type { Invite } from '@/lib/types'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  accepted:  { label: 'Awaiting visit',  color: '#F5B800' },
  posted:    { label: 'Post submitted',  color: '#C084FC' },
  verified:  { label: 'Verified',        color: '#22c55e' },
  active:    { label: 'Active',          color: '#6BE6B0' },
  completed: { label: 'Completed',       color: '#94a3b8' },
}

interface Props {
  invite: Invite
  onClose: () => void
}

export function CollabDetailModal({ invite, onClose }: Props) {
  const isRetainer = invite.invite_type === 'retainer'
  const matches    = invite.matches ?? []
  const value      = isRetainer ? (invite.fee_gbp ?? 0) : invite.value_gbp

  const claimed  = invite.slots_claimed
  const visits   = matches.filter(m => (m.scan_count ?? 0) > 0).length
  const toReview = matches.filter(m => m.status === 'posted').length
  const verified = matches.filter(m => m.status === 'verified' || m.status === 'completed').length
  const slotPct  = invite.slots_total > 0 ? Math.round((claimed / invite.slots_total) * 100) : 0

  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
      onClick={handleBackdrop}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}
      >
        {/* Header strip */}
        <div style={{ height: '4px', background: isRetainer ? '#6BE6B0' : '#F5B800', borderRadius: '16px 16px 0 0' }} />

        {/* Title row */}
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span
                className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md"
                style={{
                  background: isRetainer ? 'rgba(107,230,176,0.15)' : 'rgba(245,184,0,0.12)',
                  color: isRetainer ? '#059669' : '#b45309',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {isRetainer ? 'Retainer' : 'One-off'}
              </span>
              <CategoryBadge category={invite.category} />
              {!invite.is_active && (
                <span
                  className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md"
                  style={{ background: 'rgba(0,0,0,0.06)', color: '#9ca3af', fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Paused
                </span>
              )}
            </div>
            <h2
              className="font-bold text-[#1C2B3A] leading-snug"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '20px' }}
            >
              {invite.title}
            </h2>
          </div>

          <div className="shrink-0 text-right">
            <p
              className="font-bold leading-none"
              style={{ color: isRetainer ? '#059669' : '#b45309', fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '22px' }}
            >
              {formatGBP(value)}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {isRetainer ? '/month' : 'value'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-[#1C2B3A] hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 pb-6 flex flex-col gap-5">

          {/* 2×2 stats grid */}
          <div className="grid grid-cols-2 gap-2">
            {[
              {
                icon: <Users className="w-3.5 h-3.5" />,
                label: 'Claimed',
                value: `${claimed}/${invite.slots_total}`,
                sub: `${slotPct}% of slots`,
                color: slotPct >= 100 ? '#22c55e' : '#F5B800',
              },
              {
                icon: <QrCode className="w-3.5 h-3.5" />,
                label: 'Visits',
                value: visits,
                sub: visits === 1 ? '1 creator visited' : `${visits} creators visited`,
                color: visits > 0 ? '#6BE6B0' : '#9ca3af',
              },
              {
                icon: <FileCheck className="w-3.5 h-3.5" />,
                label: 'Posts to review',
                value: toReview,
                sub: toReview > 0 ? 'Awaiting your approval' : 'Nothing to action',
                color: toReview > 0 ? '#C084FC' : '#9ca3af',
              },
              {
                icon: <CheckCircle2 className="w-3.5 h-3.5" />,
                label: 'Verified',
                value: verified,
                sub: matches.length > 0 ? `${Math.round((verified / matches.length) * 100)}% completion rate` : '—',
                color: verified > 0 ? '#22c55e' : '#9ca3af',
              },
            ].map(s => (
              <div
                key={s.label}
                className="rounded-xl px-4 py-3"
                style={{ background: 'rgba(28,43,58,0.03)', border: '1px solid rgba(0,0,0,0.07)' }}
              >
                <div className="flex items-center gap-1.5 mb-2" style={{ color: s.color }}>
                  {s.icon}
                  <span className="text-[10px] font-bold uppercase tracking-wide" style={{ fontFamily: "'JetBrains Mono', monospace", color: s.color }}>
                    {s.label}
                  </span>
                </div>
                <p className="text-2xl font-bold mb-0.5" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: s.color }}>
                  {s.value}
                </p>
                <p className="text-[10px] text-gray-400">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Slot fill bar */}
          {invite.slots_total > 1 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  Capacity
                </p>
                <p className="text-[10px] text-gray-400">{claimed} of {invite.slots_total} slots filled</p>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.07)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${slotPct}%`, background: slotPct >= 100 ? '#22c55e' : '#F5B800' }}
                />
              </div>
            </div>
          )}

          {/* Creator roster */}
          {matches.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Creators · {matches.length}
              </p>
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
                {matches.map((m, i) => {
                  const creator    = m.creator
                  const statusMeta = STATUS_LABELS[m.status]
                  const wasVisited = (m.scan_count ?? 0) > 0
                  const initial    = creator?.display_name?.[0]?.toUpperCase() ?? '?'
                  return (
                    <div
                      key={m.id}
                      className="flex items-center gap-3 px-4 py-2.5 bg-white"
                      style={{ borderTop: i > 0 ? '1px solid rgba(0,0,0,0.06)' : undefined }}
                    >
                      {creator?.avatar_url ? (
                        <img
                          src={creator.avatar_url}
                          alt={creator.display_name}
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                          style={{ border: '1.5px solid rgba(0,0,0,0.08)' }}
                        />
                      ) : (
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                          style={{ background: 'linear-gradient(135deg, #1C2B3A, #6BE6B0)' }}
                        >
                          {initial}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#1C2B3A] truncate" style={{ fontFamily: "'Inter', sans-serif" }}>
                          {creator?.instagram_handle ? `@${creator.instagram_handle}` : (creator?.display_name ?? 'Unknown')}
                        </p>
                        {creator?.follower_count != null && (
                          <p className="text-[10px] text-gray-400">{creator.follower_count.toLocaleString()} followers</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {wasVisited && (
                          <div
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded-md"
                            style={{ background: 'rgba(107,230,176,0.15)' }}
                          >
                            <QrCode className="w-2.5 h-2.5" style={{ color: '#059669' }} />
                            <span className="text-[9px] font-bold uppercase" style={{ color: '#059669', fontFamily: "'JetBrains Mono', monospace" }}>
                              Visited
                            </span>
                          </div>
                        )}
                        {statusMeta && (
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: statusMeta.color + '18', color: statusMeta.color, fontFamily: "'JetBrains Mono', monospace" }}
                          >
                            {statusMeta.label}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Description */}
          {invite.description && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                About this collab
              </p>
              <p className="text-sm text-gray-600 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                {invite.description}
              </p>
            </div>
          )}

          {/* Requirements */}
          {invite.requirements && (
            <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(28,43,58,0.04)', border: '1px solid rgba(28,43,58,0.08)' }}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Requirements
              </p>
              <p className="text-sm text-gray-600 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                {invite.requirements}
              </p>
            </div>
          )}

          {/* Retainer terms */}
          {isRetainer && (invite.posts_per_month != null || invite.duration_months != null) && (
            <div
              className="flex flex-wrap items-center gap-4 rounded-xl px-4 py-3"
              style={{ background: 'rgba(107,230,176,0.08)', border: '1px solid rgba(107,230,176,0.2)' }}
            >
              {invite.posts_per_month != null && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Posts / month</p>
                  <p className="text-sm font-bold text-[#1C2B3A]">{invite.posts_per_month}</p>
                </div>
              )}
              {invite.duration_months != null && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Duration</p>
                  <p className="text-sm font-bold text-[#1C2B3A]">{invite.duration_months} month{invite.duration_months !== 1 ? 's' : ''}</p>
                </div>
              )}
              {invite.duration_months != null && invite.fee_gbp != null && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Total value</p>
                  <p className="text-sm font-bold" style={{ color: '#059669' }}>{formatGBP(invite.fee_gbp * invite.duration_months)}</p>
                </div>
              )}
            </div>
          )}

          {/* Dates */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Calendar className="w-3.5 h-3.5" />
              Created {formatDate(invite.created_at)}
            </div>
            {invite.expires_at && (
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Calendar className="w-3.5 h-3.5" />
                Expires {formatDate(invite.expires_at)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
