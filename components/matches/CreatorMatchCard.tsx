'use client'
import { useState, useEffect, useRef } from 'react'
import { MapPin, Check, MessageCircle, ChevronDown, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { InlineMessageThread } from '@/components/matches/InlineMessageThread'
import { formatGBP, normalizeUrl } from '@/lib/utils'
import { PuntQRCode } from '@/components/ui/PuntQRCode'
import { deriveMatchState } from '@/lib/types'
import type { Match, MatchDeliverable } from '@/lib/types'

const STATE_PILL: Record<string, { bg: string; text: string; label: string }> = {
  in_progress:  { bg: 'rgba(245,184,0,0.1)',    text: '#b45309', label: 'Awaiting posts' },
  needs_review: { bg: 'rgba(192,132,252,0.12)', text: '#9333ea', label: 'Posts pending' },
  up_to_date:   { bg: 'rgba(34,197,94,0.1)',    text: '#16a34a', label: 'All verified' },
  closed:       { bg: 'rgba(148,163,184,0.12)', text: '#64748b', label: 'Closed' },
}

const STATE_BORDER: Record<string, string> = {
  in_progress:  '#F5B800',
  needs_review: '#C084FC',
  up_to_date:   '#22c55e',
  closed:       '#94a3b8',
}

function nextStepLabel(state: string, isRetainer: boolean): string {
  if (state === 'in_progress')  return isRetainer ? 'Submit your monthly post below' : 'Add your post links below'
  if (state === 'needs_review') return 'Posts submitted · awaiting verification'
  if (state === 'up_to_date')   return 'All posts verified'
  if (state === 'closed')       return 'Collab complete'
  return ''
}

interface Props {
  match: Match
  currentUserId: string
  onUpdated: (updated: Match) => void
}

export function CreatorMatchCard({ match, currentUserId, onUpdated }: Props) {
  const [open, setOpen]                     = useState(false)
  const [msgOpen, setMsgOpen]               = useState(false)
  const [unread, setUnread]                 = useState(0)
  const msgRef = useRef<HTMLDivElement>(null)
  const [deliverableLoading, setDeliverableLoading] = useState<string | null>(null)
  const [showSubmitMonth, setShowSubmitMonth]       = useState<number | null>(null)
  const [submitUrl, setSubmitUrl]                   = useState('')
  const [submitUrlError, setSubmitUrlError]         = useState('')
  const [editingDeliverable, setEditingDeliverable] = useState<string | null>(null)
  const [editDeliverableUrl, setEditDeliverableUrl] = useState('')
  const [editDeliverableUrlError, setEditDeliverableUrlError] = useState('')
  const [showAddPost, setShowAddPost]               = useState(false)
  const [addPostUrl, setAddPostUrl]                 = useState('')
  const [addPostUrlError, setAddPostUrlError]       = useState('')
  const [addPostLoading, setAddPostLoading]         = useState(false)

  const state      = deriveMatchState(match)
  const isRetainer = match.invite?.invite_type === 'retainer'
  const isDone     = state === 'closed'
  const pill       = STATE_PILL[state] ?? STATE_PILL.in_progress
  const borderColor = STATE_BORDER[state] ?? '#94a3b8'
  const needsAction = !isDone && state === 'in_progress'

  const invite       = match.invite
  const business     = invite?.business ?? match.business
  const bizName      = business?.business_name ?? business?.display_name ?? 'Business'
  const bizAddress   = business?.address_line ?? null
  const bizAvatarUrl = invite?.business?.avatar_url ?? null
  const bizInstagram = invite?.business?.instagram_handle ?? null
  const bizLat       = invite?.business?.latitude ?? null
  const bizLng       = invite?.business?.longitude ?? null
  const bizInitial   = bizName[0]?.toUpperCase() ?? 'B'

  useEffect(() => {
    function refreshUnread() {
      fetch(`/api/matches/${match.id}/messages/unread`)
        .then(r => r.json())
        .then(d => setUnread(d.count ?? 0))
        .catch(() => {})
    }
    refreshUnread()
    window.addEventListener('badges-refresh', refreshUnread)
    return () => window.removeEventListener('badges-refresh', refreshUnread)
  }, [match.id])

  async function submitOneOffPost() {
    const normalized = normalizeUrl(addPostUrl)
    if (!normalized) { setAddPostUrlError('Enter a valid URL (e.g. www.instagram.com/p/…)'); return }
    setAddPostLoading(true)
    const res = await fetch(`/api/matches/${match.id}/deliverables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_url: normalized }),
    })
    const data = await res.json()
    if (!res.ok) toast.error(data.error ?? 'Failed to submit')
    else {
      toast.success('Post submitted')
      onUpdated({ ...match, deliverables: [...(match.deliverables ?? []), data] })
      setShowAddPost(false)
      setAddPostUrl('')
      setAddPostUrlError('')
      window.dispatchEvent(new Event('badges-refresh'))
    }
    setAddPostLoading(false)
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
      window.dispatchEvent(new Event('badges-refresh'))
    }
    setDeliverableLoading(null)
  }

  useEffect(() => {
    if (msgOpen) {
      setTimeout(() => msgRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
    }
  }, [msgOpen])

  function toggleMsg() {
    setMsgOpen(o => !o)
    if (!msgOpen) {
      setUnread(0)
      window.dispatchEvent(new Event('badges-refresh'))
    }
  }

  const cardBorderStyle: React.CSSProperties = isDone
    ? { background: '#ffffff', border: '1.5px solid #94a3b8' }
    : isRetainer
      ? { background: '#ffffff', border: '1.5px solid #60a5fa' }
      : { border: '1.5px solid transparent', background: 'linear-gradient(#ffffff, #ffffff) padding-box, linear-gradient(90deg, #833ab4, #fd1d1d, #fcb045) border-box' }

  return (
    <div
      className="rounded-2xl overflow-hidden min-w-0 w-full"
      style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06)', ...cardBorderStyle }}
    >
      {/* ── Clickable card face ── */}
      <div
        role="button"
        onClick={() => setOpen(o => !o)}
        className="cursor-pointer active:opacity-90 transition-opacity"
      >
        {/* Header: pure flex row — no absolute positioning */}
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ background: 'linear-gradient(135deg, rgba(131,58,180,0.07) 0%, rgba(253,29,29,0.06) 60%, rgba(252,176,69,0.04) 100%)' }}
        >
          {/* Business avatar — inline */}
          <div className="shrink-0">
            <div
              className="p-[2.5px] rounded-full"
              style={{ background: bizInstagram ? 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)' : 'rgba(0,0,0,0.1)' }}
            >
              <div className="p-[2px] bg-white rounded-full">
                {bizAvatarUrl ? (
                  <img src={bizAvatarUrl} alt={bizName} className="w-10 h-10 rounded-full object-cover block" />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #1C2B3A, #6BE6B0)' }}
                  >
                    {bizInitial}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Title — bounded by flex-1 min-w-0 */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <h3
              className="font-bold text-sm leading-snug line-clamp-2"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: '#1C2B3A' }}
            >
              {invite?.title ?? 'Collab'}
            </h3>
          </div>

          <ChevronDown
            className="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200"
            style={{ transform: open ? 'rotate(180deg)' : 'none' }}
          />
        </div>

        {/* Always-visible info body */}
        <div className="px-4 pt-3 pb-3 flex flex-col gap-2 overflow-hidden">

          {/* Business name + value */}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm text-[#1C2B3A] truncate" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                {bizName}
              </p>
              {bizAddress && (
                <div className="flex items-center gap-1 mt-0.5" onClick={e => e.stopPropagation()}>
                  <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                  <div className="min-w-0 flex-1 overflow-hidden truncate">
                    {bizLat && bizLng ? (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${bizLat},${bizLng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline"
                        onClick={e => e.stopPropagation()}
                      >
                        {bizAddress}
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400">{bizAddress}</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="shrink-0 text-right">
              <p className="font-bold text-base leading-none" style={{ color: isRetainer ? '#059669' : '#b45309', fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                {isRetainer ? formatGBP(invite?.fee_gbp ?? 0) : formatGBP(invite?.value_gbp ?? 0)}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {isRetainer ? '/mo' : 'value'}
              </p>
            </div>
          </div>

          {/* Status pill + badges — single non-wrapping row */}
          <div className="flex items-center gap-2 overflow-hidden">
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
              style={{ background: pill.bg, color: pill.text, fontFamily: "'JetBrains Mono', monospace" }}
            >
              {pill.label}
            </span>

            {needsAction && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
              >
                Add post ↗
              </span>
            )}

            {unread > 0 && (
              <button
                onClick={e => {
                  e.stopPropagation()
                  setOpen(true)
                  if (!msgOpen) { setMsgOpen(true); setUnread(0); window.dispatchEvent(new Event('badges-refresh')) }
                }}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 hover:opacity-80 transition-opacity ml-auto"
                style={{ background: '#F5B800', color: '#1C2B3A' }}
              >
                <MessageCircle className="w-3 h-3" />
                {unread}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Expanded body ── */}
      {open && (
        <div>
          {/* Next step label */}
          <div
            className="px-5 py-3 flex items-center gap-2.5"
            style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}
          >
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: borderColor }} />
            <p className="text-sm font-medium text-gray-600 flex-1" style={{ fontFamily: "'Inter', sans-serif" }}>
              {nextStepLabel(state, isRetainer)}
            </p>
            {isDone && (
              <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#22c55e' }}>
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          {/* About this collab + requirements */}
          {(invite?.description || invite?.requirements) && (
            <div className="px-5 py-4 flex flex-col gap-4" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
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
            </div>
          )}

          {/* One-off: deliverables */}
          {!isRetainer && (
            <div className="px-5 py-4 flex flex-col gap-2" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              {(match.deliverables ?? []).map((d, idx) => (
                <div key={d.id} className="flex flex-col gap-2">
                  <div
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                    style={{
                      background: d.verified_at ? 'rgba(107,230,176,0.08)' : 'rgba(0,0,0,0.02)',
                      border: `1px solid ${d.verified_at ? 'rgba(107,230,176,0.25)' : 'rgba(0,0,0,0.07)'}`,
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                      style={{ background: d.verified_at ? '#6BE6B0' : '#C084FC', color: '#1C2B3A' }}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <a href={d.post_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline">
                        Post {idx + 1}
                      </a>
                    </div>
                    {d.verified_at ? (
                      <Check className="w-4 h-4 flex-shrink-0" style={{ color: '#22c55e' }} />
                    ) : (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs font-medium" style={{ color: '#C084FC' }}>Pending</span>
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
                          label={`Post ${idx + 1} URL`}
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

              {!isDone && (
                showAddPost ? (
                  <div className="flex flex-col gap-2 mt-1">
                    <div>
                      <Input
                        label="Post URL"
                        placeholder="https://www.instagram.com/p/…"
                        value={addPostUrl}
                        onChange={e => { setAddPostUrl(e.target.value); setAddPostUrlError('') }}
                      />
                      {addPostUrlError && <p className="text-xs text-red-500 mt-1">{addPostUrlError}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => { setShowAddPost(false); setAddPostUrlError('') }}>Cancel</Button>
                      <Button size="sm" loading={addPostLoading} disabled={!addPostUrl.trim()} onClick={submitOneOffPost}>
                        Submit
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => { setShowAddPost(true); setAddPostUrl('') }}>
                    {(match.deliverables ?? []).length === 0 ? 'Add post link' : 'Add another post link'}
                  </Button>
                )
              )}
            </div>
          )}

          {/* Retainer: deliverables */}
          {isRetainer && (
            <div className="px-5 py-4 flex flex-col gap-2" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              {(match.deliverables ?? []).length === 0 && !isDone && (
                <p className="text-xs text-gray-400 italic">No posts submitted yet.</p>
              )}
              {[...(match.deliverables ?? [])]
                .sort((a, b) => (a.month_number ?? 0) - (b.month_number ?? 0))
                .map((d: MatchDeliverable) => (
                  <div key={d.id} className="flex flex-col gap-2">
                    <div
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                      style={{
                        background: d.verified_at ? 'rgba(107,230,176,0.08)' : 'rgba(0,0,0,0.02)',
                        border: `1px solid ${d.verified_at ? 'rgba(107,230,176,0.25)' : 'rgba(0,0,0,0.07)'}`,
                      }}
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                        style={{ background: d.verified_at ? '#6BE6B0' : '#F5B800', color: '#1C2B3A' }}
                      >
                        {d.month_number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <a href={d.post_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline">
                          Month {d.month_number} post
                        </a>
                      </div>
                      {d.verified_at ? (
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

              {!isDone && (
                showSubmitMonth === null ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => { setShowSubmitMonth(Math.max(1, (match.deliverables?.length ?? 0) + 1)); setSubmitUrl('') }}
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

          {/* Collab details */}
          <div className="px-5 py-4 flex flex-col gap-4" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
            {/* Punt code + QR */}
            <div className="flex items-center gap-4">
              <div
                className="flex-1 rounded-xl px-4 py-3"
                style={{ background: 'rgba(245,184,0,0.06)', border: '1.5px solid rgba(245,184,0,0.2)' }}
              >
                <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: '#b45309', fontFamily: "'JetBrains Mono', monospace" }}>
                  Punt code
                </p>
                <p className="font-bold tracking-widest" style={{ color: '#1C2B3A', fontFamily: "'JetBrains Mono', monospace", fontSize: '18px', letterSpacing: '0.12em' }}>
                  {match.punt_code}
                </p>
                <p className="text-[9px] mt-2" style={{ color: '#9ca3af', fontFamily: "'Inter', sans-serif" }}>
                  Show to staff on arrival
                </p>
              </div>
              {!isDone && <PuntQRCode puntCode={match.punt_code} size={88} />}
            </div>

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

          {/* Messages */}
          <div
            ref={msgRef}
            className="px-5 py-3"
            style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}
          >
            <button
              type="button"
              onClick={toggleMsg}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: msgOpen ? '#1C2B3A' : unread > 0 ? '#F5B800' : 'rgba(28,43,58,0.06)',
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
      )}
    </div>
  )
}
