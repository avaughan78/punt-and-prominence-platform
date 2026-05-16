'use client'
import { useState, useEffect, useRef } from 'react'
import { MapPin, Check, MessageCircle, ChevronDown, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { InlineMessageThread } from '@/components/matches/InlineMessageThread'
import { formatGBP, normalizeUrl } from '@/lib/utils'
import type { Match, MatchDeliverable } from '@/lib/types'

const BORDER_COLOR: Record<string, string> = {
  accepted:  '#F5B800',
  posted:    '#C084FC',
  verified:  '#22c55e',
  active:    '#6BE6B0',
  completed: '#94a3b8',
}

const STATUS_PILL: Record<string, { bg: string; text: string; label: string }> = {
  accepted:  { bg: 'rgba(245,184,0,0.1)',    text: '#b45309', label: 'Accepted' },
  posted:    { bg: 'rgba(192,132,252,0.12)', text: '#9333ea', label: 'Posted' },
  verified:  { bg: 'rgba(34,197,94,0.1)',    text: '#16a34a', label: 'Verified' },
  active:    { bg: 'rgba(107,230,176,0.12)', text: '#059669', label: 'Active' },
  completed: { bg: 'rgba(148,163,184,0.12)', text: '#64748b', label: 'Complete' },
}

function nextStepLabel(status: string, isRetainer: boolean): string {
  if (status === 'accepted')  return isRetainer ? 'Awaiting business activation' : 'Visit the venue, then add your post links below'
  if (status === 'posted')    return 'Posts submitted · awaiting verification'
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
  const [open, setOpen]                     = useState(false)
  const [msgOpen, setMsgOpen]               = useState(false)
  const [unread, setUnread]                 = useState(0)
  const msgRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading]               = useState(false)
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

  const isRetainer = match.invite?.invite_type === 'retainer'
  const isDone     = match.status === 'verified' || match.status === 'completed'
  const borderColor = BORDER_COLOR[match.status] ?? '#94a3b8'
  const pill       = STATUS_PILL[match.status] ?? STATUS_PILL.accepted

  const invite     = match.invite
  const business   = invite?.business ?? match.business
  const bizName    = business?.business_name ?? business?.display_name ?? 'Business'
  const bizAddress = business?.address_line ?? null
  const bizInitial = bizName[0]?.toUpperCase() ?? 'B'

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
    else { toast.success('Updated'); onUpdated(data) }
    setLoading(false)
  }

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
      onUpdated({
        ...match,
        status: (data.matchStatus ?? match.status) as Match['status'],
        deliverables: [...(match.deliverables ?? []), data.deliverable],
      })
      setShowAddPost(false)
      setAddPostUrl('')
      setAddPostUrlError('')
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

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: '#ffffff', border: `1.5px solid ${borderColor}`, boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
    >

      {/* Compact header row — always visible, click to expand */}
      <div
        role="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-gray-50 cursor-pointer"
      >
        {/* Business initial avatar */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white flex-shrink-0 text-sm"
          style={{ background: 'linear-gradient(135deg, #1C2B3A 0%, #2d4a63 100%)', fontFamily: "'Bricolage Grotesque', sans-serif" }}
        >
          {bizInitial}
        </div>

        {/* Biz name + collab title */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[#1C2B3A] text-sm leading-tight truncate" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            {bizName}
          </p>
          <p className="text-xs text-gray-500 mt-0.5 truncate" style={{ fontFamily: "'Inter', sans-serif" }}>
            {invite?.title ?? 'Collab'}
          </p>
        </div>

        {/* Value */}
        <div className="shrink-0 text-right">
          <p className="font-bold text-sm leading-tight" style={{ color: isRetainer ? '#059669' : '#b45309', fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            {isRetainer ? formatGBP(invite?.fee_gbp ?? 0) : formatGBP(invite?.value_gbp ?? 0)}
          </p>
          <p className="text-[9px] text-gray-400 mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {isRetainer ? '/mo' : 'value'}
          </p>
        </div>

        {/* Status pill */}
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0"
          style={{ background: pill.bg, color: pill.text, fontFamily: "'JetBrains Mono', monospace" }}
        >
          {pill.label}
        </span>

        {/* Unread message badge — click to jump straight to messages */}
        {unread > 0 && (
          <button
            onClick={e => {
              e.stopPropagation()
              setOpen(true)
              if (!msgOpen) { setMsgOpen(true); setUnread(0); window.dispatchEvent(new Event('badges-refresh')) }
            }}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 hover:opacity-80 transition-opacity"
            style={{ background: '#F5B800', color: '#1C2B3A' }}
          >
            <MessageCircle className="w-3 h-3" />
            {unread}
          </button>
        )}

        <ChevronDown
          className="w-3.5 h-3.5 text-gray-400 transition-transform duration-200 flex-shrink-0"
          style={{ transform: open ? 'rotate(180deg)' : 'none' }}
        />
      </div>

      {/* Expanded body */}
      {open && (
        <div>
          {/* Next step label */}
          <div
            className="px-5 py-3 flex items-center gap-2.5"
            style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}
          >
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: borderColor }} />
            <p className="text-sm font-medium text-gray-600 flex-1" style={{ fontFamily: "'Inter', sans-serif" }}>
              {nextStepLabel(match.status, isRetainer)}
            </p>
            {isDone && (
              <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#22c55e' }}>
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          {/* Address */}
          {bizAddress && (
            <div className="px-5 pb-3" style={{ marginTop: '-6px' }}>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(bizAddress)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium hover:underline"
                style={{ color: '#6BE6B0' }}
              >
                <MapPin className="w-3 h-3 flex-shrink-0" />
                {bizAddress}
              </a>
            </div>
          )}

          {/* One-off: deliverables */}
          {!isRetainer && (match.status === 'accepted' || match.status === 'posted' || match.status === 'verified') && (
            <div className="px-5 py-4 flex flex-col gap-2" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              {(match.deliverables ?? []).map((d, idx) => (
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
                      style={{ background: d.status === 'verified' ? '#6BE6B0' : '#C084FC', color: '#1C2B3A' }}
                    >
                      {idx + 1}
                    </div>
                    <a href={d.post_url} target="_blank" rel="noopener noreferrer" className="flex-1 text-sm text-blue-500 hover:underline truncate">
                      Post {idx + 1}
                    </a>
                    {d.status === 'verified' ? (
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

              {(match.status === 'accepted' || match.status === 'posted') && (
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
          {isRetainer && match.status !== 'accepted' && (
            <div className="px-5 py-4 flex flex-col gap-2" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              {(match.deliverables ?? []).length === 0 && match.status === 'active' && (
                <p className="text-xs text-gray-400 italic">No posts submitted yet for this month.</p>
              )}
              {[...(match.deliverables ?? [])]
                .sort((a, b) => (a.month_number ?? 0) - (b.month_number ?? 0))
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
