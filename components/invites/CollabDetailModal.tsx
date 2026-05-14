'use client'
import { X, Users, Calendar, TrendingUp } from 'lucide-react'
import { CategoryBadge } from '@/components/ui/Badge'
import { formatGBP, formatDate } from '@/lib/utils'
import type { Invite } from '@/lib/types'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  accepted:  { label: 'Accepted',       color: '#F5B800' },
  posted:    { label: 'Post submitted', color: '#C084FC' },
  verified:  { label: 'Verified',       color: '#22c55e' },
  active:    { label: 'Active',         color: '#6BE6B0' },
  completed: { label: 'Completed',      color: '#94a3b8' },
}

interface Props {
  invite: Invite
  onClose: () => void
}

export function CollabDetailModal({ invite, onClose }: Props) {
  const isRetainer = invite.invite_type === 'retainer'
  const matches = invite.matches ?? []
  const value = isRetainer ? (invite.fee_gbp ?? 0) : invite.value_gbp

  // Engagement stats
  const statusCounts = matches.reduce<Record<string, number>>((acc, m) => {
    acc[m.status] = (acc[m.status] ?? 0) + 1
    return acc
  }, {})
  const verified = (statusCounts.verified ?? 0) + (statusCounts.completed ?? 0)
  const inProgress = matches.length - verified

  // Slot fill %
  const slotPct = invite.slots_total > 0 ? Math.round((invite.slots_claimed / invite.slots_total) * 100) : 0

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
        <div
          style={{
            height: '4px',
            background: isRetainer ? '#6BE6B0' : '#F5B800',
            borderRadius: '16px 16px 0 0',
          }}
        />

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

          {/* Value */}
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
          {/* Engagement stats */}
          <div
            className="grid grid-cols-3 rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(0,0,0,0.08)' }}
          >
            {[
              {
                icon: <Users className="w-3.5 h-3.5" />,
                label: 'Slots',
                value: `${invite.slots_claimed}/${invite.slots_total}`,
                sub: `${slotPct}% claimed`,
                color: slotPct >= 100 ? '#22c55e' : '#F5B800',
              },
              {
                icon: <TrendingUp className="w-3.5 h-3.5" />,
                label: 'In progress',
                value: inProgress,
                sub: `${matches.length} total matched`,
                color: '#818cf8',
              },
              {
                icon: null,
                label: 'Verified',
                value: verified,
                sub: matches.length > 0 ? `${Math.round((verified / matches.length) * 100)}% rate` : '—',
                color: '#22c55e',
              },
            ].map((s, i) => (
              <div
                key={s.label}
                className="flex flex-col items-center py-3 px-2"
                style={{ borderLeft: i > 0 ? '1px solid rgba(0,0,0,0.06)' : undefined }}
              >
                <span className="font-bold text-xl text-[#1C2B3A] mb-0.5" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: s.color }}>
                  {s.value}
                </span>
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {s.label}
                </span>
                <span className="text-[10px] text-gray-400 mt-0.5">{s.sub}</span>
              </div>
            ))}
          </div>

          {/* Status breakdown */}
          {matches.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Status breakdown
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(statusCounts).map(([status, count]) => {
                  const meta = STATUS_LABELS[status]
                  if (!meta) return null
                  return (
                    <span
                      key={status}
                      className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: meta.color + '18', color: meta.color, fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: meta.color }}
                      />
                      {count} · {meta.label}
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          {/* Slot fill bar */}
          {invite.slots_total > 1 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  Capacity
                </p>
                <p className="text-[10px] text-gray-400">{invite.slots_claimed} of {invite.slots_total} slots filled</p>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.07)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${slotPct}%`, background: slotPct >= 100 ? '#22c55e' : '#F5B800' }}
                />
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
              className="flex items-center gap-6 rounded-xl px-4 py-3"
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
