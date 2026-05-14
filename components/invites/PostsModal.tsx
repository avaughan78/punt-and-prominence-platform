'use client'
import { useState } from 'react'
import { ExternalLink, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import type { MatchPreview, MatchDeliverable } from '@/lib/types'

interface Props {
  match: MatchPreview
  creatorName: string
  collabTitle: string
  isRetainer: boolean
  onDeliverableVerified: (matchId: string, deliverableId: string) => void
  onClose: () => void
}

export function PostsModal({ match, creatorName, collabTitle, isRetainer, onDeliverableVerified, onClose }: Props) {
  const [deliverables, setDeliverables] = useState<MatchDeliverable[]>(match.deliverables ?? [])
  const [verifyingDid, setVerifyingDid] = useState<string | null>(null)

  // Legacy: match had a post_url before deliverables existed
  const legacyUrl = match.post_url && deliverables.length === 0 ? match.post_url : null

  async function verifyDeliverable(did: string) {
    setVerifyingDid(did)
    const res = await fetch(`/api/matches/${match.id}/deliverables/${did}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify' }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error ?? 'Failed to verify')
    } else {
      setDeliverables(prev => prev.map(d => d.id === did ? { ...d, status: 'verified', verified_at: new Date().toISOString() } : d))
      onDeliverableVerified(match.id, did)
      toast.success('Post verified')
    }
    setVerifyingDid(null)
  }

  function fmt(dt: string) {
    return new Date(dt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden flex flex-col"
        style={{ background: '#ffffff', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '85vh' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
          <div>
            <p className="font-bold text-[#1C2B3A] text-base" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              Posts from {creatorName}
            </p>
            <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {collabTitle}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 transition-colors ml-4 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Posts list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">
          {legacyUrl && (
            <div
              className="flex items-center gap-3 rounded-xl px-3 py-3"
              style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.07)' }}
            >
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                style={{ background: '#C084FC', color: '#1C2B3A' }}>1</div>
              <a href={legacyUrl} target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center gap-1.5 text-sm text-blue-500 hover:underline truncate">
                <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                View post
              </a>
            </div>
          )}

          {deliverables.length === 0 && !legacyUrl && (
            <p className="text-sm text-gray-400 italic text-center py-4">No posts submitted yet.</p>
          )}

          {deliverables.map((d, idx) => (
            <div
              key={d.id}
              className="flex items-center gap-3 rounded-xl px-3 py-3"
              style={{
                background: d.status === 'verified' ? 'rgba(107,230,176,0.08)' : 'rgba(0,0,0,0.02)',
                border: `1px solid ${d.status === 'verified' ? 'rgba(107,230,176,0.25)' : 'rgba(0,0,0,0.07)'}`,
              }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                style={{ background: d.status === 'verified' ? '#6BE6B0' : '#C084FC', color: '#1C2B3A' }}
              >
                {d.month_number ?? idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <a href={d.post_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-blue-500 hover:underline truncate">
                  <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                  {isRetainer ? `Month ${d.month_number} post` : `Post ${idx + 1}`}
                </a>
                <p className="text-[10px] text-gray-400 mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {fmt(d.created_at)}
                  {d.verified_at && ` · verified ${fmt(d.verified_at)}`}
                </p>
              </div>
              {d.status === 'verified' ? (
                <Check className="w-4 h-4 flex-shrink-0" style={{ color: '#22c55e' }} />
              ) : (
                <Button
                  size="sm"
                  loading={verifyingDid === d.id}
                  onClick={() => verifyDeliverable(d.id)}
                >
                  Verify
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-end" style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }}>
          <button onClick={onClose} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
