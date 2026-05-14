'use client'
import { useState, useEffect, useRef } from 'react'
import { MapPin, ExternalLink, Check, MessageCircle, ChevronDown, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { InlineMessageThread } from '@/components/matches/InlineMessageThread'
import { formatGBP, isValidUrl, normalizeUrl } from '@/lib/utils'
import type { Match, MatchDeliverable } from '@/lib/types'

const STRIP_COLOR: Record<string, string> = {
  accepted:  '#F5B800',
  posted:    '#C084FC',
  verified:  '#22c55e',
  active:    '#6BE6B0',
  completed: '#94a3b8',
}

const STATUS_PILL: Record<string, { bg: string; text: string }> = {
  accepted:  { bg: 'rgba(245,184,0,0.1)',    text: '#b45309' },
  posted:    { bg: 'rgba(192,132,252,0.12)', text: '#9333ea' },
  verified:  { bg: 'rgba(34,197,94,0.1)',    text: '#16a34a' },
  active:    { bg: 'rgba(107,230,176,0.12)', text: '#059669' },
  completed: { bg: 'rgba(148,163,184,0.12)', text: '#64748b' },
}

function nextStepLabel(status: string, isRetainer: boolean): string {
  if (status === 'accepted')  return isRetainer ? 'Awaiting business activation' : 'Visit the venue, then submit your post link'
  if (status === 'posted')    return 'Post submitted · awaiting verification'
  if (status === 'verified')  return 'Verified and complete'
  if (status === 'active')    return 'Submit your monthly post'
  if (status === 'completed') return 'Arrangement complete'
  return ''
}

interface Props {
  match: Match
  currentUserId: string
  onUpdated: (updated: Match) => void
}

export function CreatorMatchCard({ match, currentUserId, onUpdated }: Props) {
  const [msgOpen, setMsgOpen]         = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [unread, setUnread]           = useState(0)
  const msgRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading]         = useState(false)
  const [showPostForm, setShowPostForm]   = useState(false)
  const [postUrl, setPostUrl]             = useState(match.post_url ?? '')
  const [editingPostUrl, setEditingPostUrl] = useState(false)
  const [editPostUrl, setEditPostUrl]     = useState(match.post_url ?? '')
  const [deliverableLoading, setDeliverableLoading] = useState<string | null>(null)
  const [showSubmitMonth, setShowSubmitMonth] = useState<number | null>(null)
  const [submitUrl, setSubmitUrl] = useState('')
  const [submitUrlError, setSubmitUrlError] = useState('')
  const [editingDeliverable, setEditingDeliverable] = useState<string | null>(null)
  const [editDeliverableUrl, setEditDeliverableUrl] = useState('')
  const [editDeliverableUrlError, setEditDeliverableUrlError] = useState('')
  const [postUrlError, setPostUrlError] = useState('')
  const [editPostUrlError, setEditPostUrlError] = useState('')

  const isRetainer = match.invite?.invite_type === 'retainer'
  const isDone     = match.status === 'verified' || match.status === 'completed'
  const strip      = STRIP_COLOR[match.status] ?? '#94a3b8'
  const pill       = STATUS_PILL[match.status] ?? STATUS_PILL.accepted

  const invite       = match.invite
  const business     = invite?.business ?? match.business
  const bizName      = business?.business_name ?? business?.display_name ?? 'Business'
  const bizAddress   = business?.address_line ?? null
  const bizInitial   = bizName[0]?.toUpperCase() ?? 'B'

  useEffect(() => {
    fetch(`/api/matches/${match.id}/messages/unread`)
      .then(r => r.json())
      .then(d => setUnread(d.count ?? 0))
      .catch(() => {})
  }, [match.id])

  async function updateStatus(status: string, extra?: Record<string, string>) {
    setLoading(true)
    const res = await fetch(`/api/matches/${match.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, ...extra }),
    })
    const data = await res.json()
    if (!res.ok) toast.error(data.error ?? 'Failed to update')
    else { toast.success('Updated'); onUpdated(data); setShowPostForm(false) }
    setLoading(false)
  }

  async function updatePostUrl(url: string) {
    const normalized = normalizeUrl(url)
    if (!normalized) { setEditPostUrlError('Enter a valid URL'); return }
    setLoading(true)
    const res = await fetch(`/api/matches/${match.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_url: normalized }),
    })
    const data = await res.json()
    if (!res.ok) toast.error(data.error ?? 'Failed to update')
    else { toast.success('Post link updated'); onUpdated(data); setEditingPostUrl(false); setEditPostUrlError('') }
    setLoading(false)
  }

  async function removePostLink() {
    setLoading(true)
    const res = await fetch(`/api/matches/${match.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'accepted', post_url: null }),
    })
    const data = await res.json()
    if (!res.ok) toast.error(data.error ?? 'Failed to remove link')
    else { toast.success('Post link removed'); onUpdated(data) }
    setLoading(false)
  }

  async function updateDeliverableUrl(did: string, url: string) {
    const normalized = normalizeUrl(url)
    if (!normalized) { setEditDeliverableUrlError('Enter a valid URL'); return }
    setDeliverableLoading(`edit-${did}`)
    const res = await fetch(`/api/matches/${match.id}/deliverables/${did}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_url: normalized }),
    })
    const data = await res.json()
    if (!res.ok) toast.error(data.error ?? 'Failed to update')
    else {
      toast.success('Post link updated')
      onUpdated({ ...match, deliverables: (match.deliverables ?? []).map(d => d.id === did ? data : d) })
      setEditingDeliverable(null)
      setEditDeliverableUrlError('')
    }
    setDeliverableLoading(null)
  }

  async function deleteDeliverable(did: string) {
    setDeliverableLoading(`delete-${did}`)
    const res = await fetch(`/api/matches/${match.id}/deliverables/${did}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error ?? 'Failed to delete')
    } else {
      toast.success('Post link removed')
      onUpdated({ ...match, deliverables: (match.deliverables ?? []).filter(d => d.id !== did) })
    }
    setDeliverableLoading(null)
  }

  async function submitDeliverable(month: number) {
    const normalized = normalizeUrl(submitUrl)
    if (!normalized) { setSubmitUrlError('Enter a valid URL'); return }
    setDeliverableLoading(`submit-${month}`)
    const res = await fetch(`/api/matches/${match.id}/deliverables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month_number: month, post_url: normalized }),
    })
    const data = await res.json()
    if (!res.ok) toast.error(data.error ?? 'Failed to submit')
    else {
      toast.success(`Month ${month} submitted`)
      onUpdated({ ...match, deliverables: [...(match.deliverables ?? []), data] })
      setShowSubmitMonth(null)
      setSubmitUrl('')
      setSubmitUrlError('')
    }
    setDeliverableLoading(null)
  }

  useEffect(() => {
    if (msgOpen) {
      setTimeout(() => msgRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50)
    }
  }, [msgOpen])

  function toggleMsg() {
    setMsgOpen(o => !o)
    if (!msgOpen) setUnread(0)
  }

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden"
      style={{ border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
    >
      {/* Thin status strip */}
      <div style={{ height: '4px', background: strip }} />

      {/* ── Business identity header ── */}
      <div className="px-5 pt-4 pb-4">
        <div className="flex items-start gap-3">
          {/* Business initial avatar */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white flex-shrink-0 text-sm"
            style={{ background: 'linear-gradient(135deg, #1C2B3A 0%, #2d4a63 100%)', fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            {bizInitial}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-[#1C2B3A] leading-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '15px' }}>
              {bizName}
            </p>
            <p className="text-sm text-gray-500 mt-0.5 truncate" style={{ fontFamily: "'Inter', sans-serif" }}>
              {invite?.title ?? 'Collab'}
            </p>
            {bizAddress && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(bizAddress)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium hover:underline"
                style={{ color: '#6BE6B0' }}
              >
                <MapPin className="w-3 h-3 flex-shrink-0" />
                {bizAddress}
              </a>
            )}
          </div>

          {/* Value + type */}
          <div className="shrink-0 text-right">
            <p
              className="font-bold leading-none"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '17px', color: isRetainer ? '#059669' : '#b45309' }}
            >
              {isRetainer ? formatGBP(invite?.fee_gbp ?? 0) : formatGBP(invite?.value_gbp ?? 0)}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {isRetainer ? '/month' : 'value'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Status / next step ── */}
      <div
        className="px-5 py-3 flex items-center gap-2.5"
        style={{ borderTop: '1px solid rgba(0,0,0,0.06)', background: '#ffffff' }}
      >
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: strip }} />
        <p className="text-sm font-medium" style={{ color: '#374151', fontFamily: "'Inter', sans-serif" }}>
          {nextStepLabel(match.status, isRetainer)}
        </p>
        {isDone && (
          <div className="ml-auto w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#22c55e' }}>
            <Check className="w-3 h-3 text-white" />
          </div>
        )}
        {!isDone && (
          <span
            className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: pill.bg, color: pill.text, fontFamily: "'JetBrains Mono', monospace" }}
          >
            {match.status}
          </span>
        )}
      </div>

      {/* ── One-off: submit post ── */}
      {!isRetainer && match.status === 'accepted' && (
        <div className="px-5 py-3" style={{ borderTop: '1px solid rgba(0,0,0,0.06)', background: '#ffffff' }}>
          {!showPostForm ? (
            <Button size="sm" onClick={() => setShowPostForm(true)}>
              Submit post link
            </Button>
          ) : (
            <div className="flex flex-col gap-2">
              <div>
                <Input
                  label="Instagram post URL"
                  placeholder="https://www.instagram.com/p/…"
                  value={postUrl}
                  onChange={e => { setPostUrl(e.target.value); setPostUrlError('') }}
                />
                {postUrlError && <p className="text-xs text-red-500 mt-1">{postUrlError}</p>}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => { setShowPostForm(false); setPostUrlError('') }}>Cancel</Button>
                <Button
                  size="sm"
                  loading={loading}
                  disabled={!postUrl.trim()}
                  onClick={() => {
                    const normalized = normalizeUrl(postUrl)
                    if (!normalized) { setPostUrlError('Enter a valid URL (e.g. www.instagram.com/p/…)'); return }
                    updateStatus('posted', { post_url: normalized })
                  }}
                >
                  Submit
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── One-off: post submitted ── */}
      {!isRetainer && match.status === 'posted' && (
        <div className="px-5 py-3" style={{ borderTop: '1px solid rgba(0,0,0,0.06)', background: '#ffffff' }}>
          {!editingPostUrl ? (
            <div className="flex items-center gap-3 flex-wrap">
              {match.post_url && (
                <a
                  href={match.post_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm font-medium hover:underline"
                  style={{ color: '#3b82f6' }}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View submitted post
                </a>
              )}
              <span className="text-xs text-gray-400 flex-1">Waiting for verification</span>
              <button
                onClick={() => { setEditPostUrl(match.post_url ?? ''); setEditingPostUrl(true); setEditPostUrlError('') }}
                className="text-xs text-gray-400 hover:text-[#1C2B3A] transition-colors underline"
              >
                Edit
              </button>
              <button
                onClick={removePostLink}
                disabled={loading}
                className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Remove
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div>
                <Input
                  label="Update post URL"
                  placeholder="https://www.instagram.com/p/…"
                  value={editPostUrl}
                  onChange={e => { setEditPostUrl(e.target.value); setEditPostUrlError('') }}
                />
                {editPostUrlError && <p className="text-xs text-red-500 mt-1">{editPostUrlError}</p>}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => { setEditingPostUrl(false); setEditPostUrlError('') }}>Cancel</Button>
                <Button
                  size="sm"
                  loading={loading}
                  disabled={!editPostUrl.trim()}
                  onClick={() => updatePostUrl(editPostUrl)}
                >
                  Save
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Retainer: deliverables ── */}
      {isRetainer && match.status !== 'accepted' && (
        <div className="px-5 py-4 flex flex-col gap-2" style={{ borderTop: '1px solid rgba(0,0,0,0.06)', background: '#ffffff' }}>
          {(match.deliverables ?? []).length === 0 && match.status === 'active' && (
            <p className="text-xs text-gray-400 italic">No posts submitted yet for this month.</p>
          )}
          {[...(match.deliverables ?? [])]
            .sort((a, b) => a.month_number - b.month_number)
            .map((d: MatchDeliverable) => (
              <div key={d.id} className="flex flex-col gap-2">
                <div
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                  style={{
                    background: d.status === 'verified' ? 'rgba(107,230,176,0.08)' : 'rgba(0,0,0,0.02)',
                    border: `1px solid ${d.status === 'verified' ? 'rgba(107,230,176,0.25)' : 'rgba(0,0,0,0.07)'}`,
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                    style={{ background: d.status === 'verified' ? '#6BE6B0' : '#F5B800', color: '#1C2B3A' }}
                  >
                    {d.month_number}
                  </div>
                  <a href={d.post_url} target="_blank" rel="noopener noreferrer" className="flex-1 text-sm text-blue-500 hover:underline truncate">
                    Month {d.month_number} post
                  </a>
                  {d.status === 'verified' ? (
                    <Check className="w-4 h-4 flex-shrink-0" style={{ color: '#22c55e' }} />
                  ) : (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-medium" style={{ color: '#F5B800' }}>Pending</span>
                      <button
                        onClick={() => { setEditingDeliverable(d.id); setEditDeliverableUrl(d.post_url); setEditDeliverableUrlError('') }}
                        className="text-xs text-gray-400 hover:text-[#1C2B3A] transition-colors underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteDeliverable(d.id)}
                        disabled={deliverableLoading === `delete-${d.id}`}
                        className="flex items-center gap-0.5 text-xs text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
                {editingDeliverable === d.id && (
                  <div className="flex flex-col gap-2 pl-10">
                    <div>
                      <Input
                        label={`Month ${d.month_number} post URL`}
                        placeholder="https://www.instagram.com/p/…"
                        value={editDeliverableUrl}
                        onChange={e => { setEditDeliverableUrl(e.target.value); setEditDeliverableUrlError('') }}
                      />
                      {editDeliverableUrlError && <p className="text-xs text-red-500 mt-1">{editDeliverableUrlError}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => { setEditingDeliverable(null); setEditDeliverableUrlError('') }}>Cancel</Button>
                      <Button
                        size="sm"
                        loading={deliverableLoading === `edit-${d.id}`}
                        disabled={!editDeliverableUrl.trim()}
                        onClick={() => updateDeliverableUrl(d.id, editDeliverableUrl)}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}

          {match.status === 'active' && (
            showSubmitMonth === null ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setShowSubmitMonth(Math.max(1, (match.deliverables?.length ?? 0) + 1))
                  setSubmitUrl('')
                }}
              >
                Submit month {Math.max(1, (match.deliverables?.length ?? 0) + 1)} post
              </Button>
            ) : (
              <div className="flex flex-col gap-2 mt-1">
                <div>
                  <Input
                    label={`Month ${showSubmitMonth} post URL`}
                    placeholder="https://www.instagram.com/p/…"
                    value={submitUrl}
                    onChange={e => { setSubmitUrl(e.target.value); setSubmitUrlError('') }}
                  />
                  {submitUrlError && <p className="text-xs text-red-500 mt-1">{submitUrlError}</p>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => { setShowSubmitMonth(null); setSubmitUrlError('') }}>Cancel</Button>
                  <Button
                    size="sm"
                    loading={deliverableLoading === `submit-${showSubmitMonth}`}
                    disabled={!submitUrl.trim()}
                    onClick={() => submitDeliverable(showSubmitMonth!)}
                  >
                    Submit
                  </Button>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* ── Collab details toggle ── */}
      <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', background: '#ffffff' }}>
        <button
          onClick={() => setDetailsOpen(o => !o)}
          className="w-full flex items-center justify-between px-5 py-3 transition-colors hover:bg-gray-50"
        >
          <span className="text-xs font-semibold text-gray-500" style={{ fontFamily: "'Inter', sans-serif" }}>
            Collab details
          </span>
          <ChevronDown
            className="w-3.5 h-3.5 text-gray-400 transition-transform duration-200"
            style={{ transform: detailsOpen ? 'rotate(180deg)' : 'none' }}
          />
        </button>

        {detailsOpen && (
          <div
            className="px-5 pb-5 flex flex-col gap-4"
            style={{ background: '#ffffff' }}
          >
            {/* Punt code */}
            <div
              className="flex items-center justify-between rounded-xl px-4 py-3"
              style={{ background: 'white', border: '1.5px solid #1C2B3A' }}
            >
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: '#9ca3af', fontFamily: "'JetBrains Mono', monospace" }}>
                  Punt code
                </p>
                <p className="font-bold tracking-widest" style={{ color: '#1C2B3A', fontFamily: "'JetBrains Mono', monospace", fontSize: '18px', letterSpacing: '0.12em' }}>
                  {match.punt_code}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: '#9ca3af', fontFamily: "'JetBrains Mono', monospace" }}>
                  {isRetainer ? 'Retainer' : 'One-off'}
                </p>
                <p className="font-bold" style={{ color: isRetainer ? '#059669' : '#b45309', fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '15px' }}>
                  {isRetainer ? formatGBP(invite?.fee_gbp ?? 0) : formatGBP(invite?.value_gbp ?? 0)}
                </p>
                <p className="text-[9px] text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {isRetainer ? '/month' : 'value'}
                </p>
              </div>
            </div>

            {/* Description */}
            {invite?.description && (
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
            {invite?.requirements && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  Requirements
                </p>
                <p className="text-sm text-gray-600 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {invite.requirements}
                </p>
              </div>
            )}

            {/* Retainer terms */}
            {isRetainer && (invite?.posts_per_month != null || invite?.duration_months != null) && (
              <div className="flex items-center gap-4">
                {invite?.posts_per_month != null && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Posts / month</p>
                    <p className="text-sm font-bold text-[#1C2B3A]">{invite.posts_per_month}</p>
                  </div>
                )}
                {invite?.duration_months != null && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Duration</p>
                    <p className="text-sm font-bold text-[#1C2B3A]">{invite.duration_months} month{invite.duration_months !== 1 ? 's' : ''}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Messaging footer ── */}
      <div
        ref={msgRef}
        className="px-5 py-3"
        style={{ borderTop: '1px solid rgba(0,0,0,0.06)', background: '#ffffff' }}
      >
        <button
          onClick={toggleMsg}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
          style={{
            background: msgOpen
              ? '#1C2B3A'
              : unread > 0
                ? '#F5B800'
                : 'rgba(28,43,58,0.06)',
            color: msgOpen ? 'white' : unread > 0 ? '#1C2B3A' : '#6b7280',
          }}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          {unread > 0 && !msgOpen ? `${unread} new` : 'Message'}
        </button>

        {msgOpen && (
          <div className="mt-3">
            <InlineMessageThread matchId={match.id} currentUserId={currentUserId} />
          </div>
        )}
      </div>
    </div>
  )
}
