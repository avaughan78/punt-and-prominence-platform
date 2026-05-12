'use client'
import { useState } from 'react'
import { Check, ExternalLink, MapPin } from 'lucide-react'
import { InstagramHandle } from '@/components/ui/InstagramHandle'
import { toast } from 'sonner'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatDate, formatGBP } from '@/lib/utils'
import type { Match, Role } from '@/lib/types'

const STEPS = ['pending', 'visited', 'posted', 'verified'] as const

interface Props {
  match: Match
  role: Role
  onUpdated: (updated: Match) => void
}

export function MatchCard({ match, role, onUpdated }: Props) {
  const [loading, setLoading] = useState(false)
  const [showPostUrl, setShowPostUrl] = useState(false)
  const [postUrl, setPostUrl] = useState(match.post_url ?? '')

  const stepIdx = STEPS.indexOf(match.status as typeof STEPS[number])

  async function updateStatus(status: string, extra?: Record<string, string>) {
    setLoading(true)
    const res = await fetch(`/api/matches/${match.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, ...extra }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error ?? 'Failed to update')
    } else {
      toast.success('Match updated')
      onUpdated(data)
      setShowPostUrl(false)
    }
    setLoading(false)
  }

  const invite = match.invite
  const businessName = invite?.business?.business_name ?? match.business?.business_name ?? match.business?.display_name ?? 'Unknown business'
  const businessAddress = invite?.business?.address_line ?? match.business?.address_line ?? null
  const creatorHandle = match.creator?.instagram_handle
    ? `@${match.creator.instagram_handle}`
    : match.creator?.display_name ?? 'Unknown creator'

  return (
    <Card className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-[#1C2B3A] leading-snug" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            {invite?.title ?? 'Invite'}
          </p>
          {role === 'creator' ? (
            <p className="text-xs font-medium mt-0.5" style={{ color: '#6b7280', fontFamily: "'Inter', sans-serif" }}>{businessName}</p>
          ) : match.creator?.instagram_handle ? (
            <div className="mt-1 flex flex-col gap-1">
              <InstagramHandle
                handle={match.creator.instagram_handle}
                displayName={match.creator.display_name}
                avatarUrl={match.creator.avatar_url}
                size="sm"
              />
              {match.creator.follower_count != null && (
                <p className="text-xs text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {match.creator.follower_count.toLocaleString()} followers
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-500 mt-0.5">{match.creator?.display_name}</p>
          )}
        </div>
        <StatusBadge status={match.status} />
      </div>

      {/* Invite details (creator only) */}
      {role === 'creator' && (invite?.description || invite?.requirements || businessAddress) && (
        <div className="flex flex-col gap-2 text-sm rounded-xl px-4 py-3" style={{ background: 'rgba(28,43,58,0.04)' }}>
          {businessAddress && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(businessAddress)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs hover:underline"
              style={{ color: '#1C2B3A', fontFamily: "'Inter', sans-serif" }}
            >
              <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: '#6BE6B0' }} />
              {businessAddress}
            </a>
          )}
          {invite?.description && (
            <p className="text-xs text-gray-600" style={{ fontFamily: "'Inter', sans-serif" }}>
              {invite.description}
            </p>
          )}
          {invite?.requirements && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Requirements</p>
              <p className="text-xs text-gray-600" style={{ fontFamily: "'Inter', sans-serif" }}>{invite.requirements}</p>
            </div>
          )}
        </div>
      )}

      {/* Punt code */}
      <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: 'rgba(28,43,58,0.04)' }}>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>PUNT CODE</p>
          <p className="font-bold text-[#1C2B3A] text-lg tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{match.punt_code}</p>
        </div>
        {invite && (
          <div className="ml-auto text-right">
            <p className="text-[10px] text-gray-400 mb-0.5">Invite value</p>
            <p className="font-semibold text-sm" style={{ color: '#F5B800' }}>{formatGBP(invite.value_gbp)}</p>
          </div>
        )}
      </div>

      {/* Progress stepper */}
      <div className="flex items-center gap-0">
        {STEPS.map((step, i) => {
          const done = i < stepIdx
          const active = i === stepIdx
          return (
            <div key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                  style={{
                    background: done ? '#6BE6B0' : active ? '#F5B800' : 'rgba(0,0,0,0.08)',
                    color: done || active ? '#1C2B3A' : '#9ca3af',
                  }}
                >
                  {done ? <Check className="w-3 h-3" /> : i + 1}
                </div>
                <p className="text-[9px] mt-1 text-center capitalize" style={{ color: active ? '#1C2B3A' : '#9ca3af', fontFamily: "'JetBrains Mono', monospace" }}>
                  {step}
                </p>
              </div>
              {i < STEPS.length - 1 && (
                <div className="h-0.5 flex-1 -mt-4" style={{ background: done ? '#6BE6B0' : 'rgba(0,0,0,0.08)' }} />
              )}
            </div>
          )
        })}
      </div>

      {/* Post URL if submitted */}
      {match.post_url && (
        <a
          href={match.post_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs text-blue-600 hover:underline"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          View post
        </a>
      )}

      {/* Action button */}
      <div className="pt-1 border-t border-black/5">
        {role === 'business' && match.status === 'pending' && (
          <Button size="sm" onClick={() => updateStatus('visited')} loading={loading}>
            Mark as visited
          </Button>
        )}
        {role === 'business' && match.status === 'posted' && (
          <Button size="sm" onClick={() => updateStatus('verified')} loading={loading}>
            Verify post
          </Button>
        )}
        {role === 'creator' && match.status === 'visited' && !showPostUrl && (
          <Button size="sm" onClick={() => setShowPostUrl(true)}>
            Submit post link
          </Button>
        )}
        {role === 'creator' && match.status === 'visited' && showPostUrl && (
          <div className="flex flex-col gap-2">
            <Input
              label="Post URL"
              placeholder="https://www.instagram.com/p/..."
              value={postUrl}
              onChange={e => setPostUrl(e.target.value)}
            />
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setShowPostUrl(false)}>Cancel</Button>
              <Button size="sm" onClick={() => updateStatus('posted', { post_url: postUrl })} loading={loading} disabled={!postUrl}>
                Submit
              </Button>
            </div>
          </div>
        )}
        {match.status === 'verified' && (
          <p className="text-xs font-semibold" style={{ color: '#22c55e', fontFamily: "'JetBrains Mono', monospace" }}>
            ✓ Verified — match complete
          </p>
        )}
        <p className="text-xs text-gray-400 mt-1">Claimed {formatDate(match.created_at)}</p>
      </div>
    </Card>
  )
}
