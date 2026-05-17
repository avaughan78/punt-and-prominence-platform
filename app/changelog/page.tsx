import Link from 'next/link'

const entries = [
  {
    date: '2025-05-17',
    version: 'v0.9',
    title: 'State model refactor + full site review',
    changes: [
      {
        type: 'breaking',
        summary: 'Replaced status field with timestamp-based state',
        detail: 'matches.status (accepted/posted/verified) replaced by matches.closed_at (timestamp). Post URLs moved to match_deliverables table. State is now derived: in_progress → needs_review → up_to_date → closed.',
      },
      {
        type: 'fix',
        summary: 'Business collabs page was showing empty',
        detail: 'API route was selecting stale match fields (status, post_url) that no longer exist, causing Supabase to error. Fixed all select queries to use the new schema.',
      },
      {
        type: 'fix',
        summary: 'Creator dashboard showing wrong "available collabs" count',
        detail: 'Dashboard query was selecting matches.status which silently failed, resulting in an empty claimedOfferIds set and every offer appearing available.',
      },
      {
        type: 'fix',
        summary: 'Public creator pages using stale status field',
        detail: 'creators/page.tsx, api/public/creators, api/business/creators, and api/admin/businesses all queried matches.status === "verified" to derive verified collab counts. Updated to use closed_at IS NOT NULL.',
      },
      {
        type: 'fix',
        summary: 'Admin match PATCH endpoint was entirely non-functional',
        detail: 'The endpoint tried to update matches.status which no longer exists. Rewritten to accept { closed_at } to allow admins to close or reopen individual matches, with audit logging.',
      },
      {
        type: 'feature',
        summary: 'Collab close now cascades to all matches automatically',
        detail: 'Removed per-match close button from business UI. When a business closes a collab (sets is_active → false), closed_at is automatically cascaded to all its matches. Reopening cascades closed_at = null.',
      },
      {
        type: 'feature',
        summary: 'Creator match filters updated for new state model',
        detail: 'Filters now map correctly: To do = in_progress state, Submitted = needs_review state, Done = closed. Filter labelled "Active" (was "In progress") to avoid confusion with internal state name. Unread messages filter added.',
      },
      {
        type: 'fix',
        summary: 'Creator profile platform links truncating on small screens',
        detail: 'Three platform links (Instagram, TikTok, website) were in a flex row and getting squashed when handles were long. Changed to a vertical stack with consistent pill styling.',
      },
      {
        type: 'feature',
        summary: 'Home page "How it works" section added',
        detail: 'New 3-step section explains the collab process for businesses: Post → Creator visits → Content goes live. Includes the zero-risk guarantee CTA.',
      },
      {
        type: 'polish',
        summary: 'Home page copy improvements',
        detail: 'Headline updated to "Cambridge creators. Authentic reach. Real results." Sub-headline clarified to emphasise local-only, no inflated counts. Cambridge section copy updated to use live stats.',
      },
      {
        type: 'polish',
        summary: 'Match state sort order: needs_review now sorts first',
        detail: 'Matches requiring action (posts submitted, awaiting business verification) now appear at the top of both the creator matches list and admin collabs view.',
      },
    ],
  },
  {
    date: '2025-05-10',
    version: 'v0.8',
    title: 'Deliverables, retainer support, and messaging',
    changes: [
      {
        type: 'feature',
        summary: 'match_deliverables table and multi-month retainer support',
        detail: 'Retainer collabs now track per-month deliverables with post URLs and verification timestamps. One-off collabs use a single deliverable row.',
      },
      {
        type: 'feature',
        summary: 'In-platform messaging between businesses and creators',
        detail: 'Thread-based messaging per match. Unread badge counts shown in nav and dashboard. Real-time updates via Supabase subscriptions.',
      },
      {
        type: 'feature',
        summary: 'QR code visit tracking (punt codes)',
        detail: 'Each match gets a unique punt_code. When a creator scans on-site, scan_count and first_scanned_at are recorded. Businesses can see visit confirmation before a post is submitted.',
      },
      {
        type: 'feature',
        summary: 'Business collabs page with full match management',
        detail: 'Businesses can view all their collabs, see creator matches, verify deliverables, and toggle collabs open/closed.',
      },
    ],
  },
  {
    date: '2025-04-28',
    version: 'v0.7',
    title: 'Creator onboarding and profile pages',
    changes: [
      {
        type: 'feature',
        summary: 'Creator onboarding flow',
        detail: 'Multi-step onboarding captures Instagram/TikTok handles, follower counts, bio, and profile picture. Creators are flagged for manual approval before they can claim collabs.',
      },
      {
        type: 'feature',
        summary: 'Public creator profile pages',
        detail: 'Each creator has a public profile showing their collab history, verified posts, and platform reach. Accessible to businesses and publicly.',
      },
      {
        type: 'feature',
        summary: 'Creator profile preview',
        detail: 'Creators can preview how their profile appears to businesses before it goes live.',
      },
    ],
  },
  {
    date: '2025-04-15',
    version: 'v0.6',
    title: 'Business invite system + creator browse',
    changes: [
      {
        type: 'feature',
        summary: 'Business collab posting',
        detail: 'Businesses can post one-off or retainer collabs with value, requirements, slot limits, and expiry dates.',
      },
      {
        type: 'feature',
        summary: 'Creator browse and claim flow',
        detail: 'Creators browse available collabs, see offer details, and claim a slot. Claims are subject to slot availability and creator approval status.',
      },
      {
        type: 'feature',
        summary: 'Admin panel: collabs, businesses, creators, audit log',
        detail: 'Internal admin tool for reviewing collabs, verifying creators, managing businesses, and viewing the full audit trail.',
      },
    ],
  },
]

const TYPE_META: Record<string, { label: string; bg: string; color: string }> = {
  breaking: { label: 'Breaking',  bg: 'rgba(239,68,68,0.1)',   color: '#dc2626'  },
  fix:      { label: 'Fix',       bg: 'rgba(34,197,94,0.1)',   color: '#16a34a'  },
  feature:  { label: 'Feature',   bg: 'rgba(96,165,250,0.12)', color: '#1d4ed8'  },
  polish:   { label: 'Polish',    bg: 'rgba(245,184,0,0.12)',  color: '#b45309'  },
}

export default function ChangelogPage() {
  return (
    <div className="min-h-screen" style={{ background: '#f8f9fb' }}>
      {/* Header */}
      <div style={{ background: '#1C2B3A' }}>
        <div className="max-w-3xl mx-auto px-6 py-6 flex items-center justify-between">
          <Link href="/home" className="text-sm font-semibold tracking-widest" style={{ color: '#F5B800', fontFamily: "'JetBrains Mono', monospace" }}>
            ★ PUNT & PROMINENCE
          </Link>
          <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', fontFamily: "'JetBrains Mono', monospace" }}>
            Internal changelog
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-14">
          <h1 className="text-4xl font-bold text-[#1C2B3A] mb-3" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            Changelog
          </h1>
          <p className="text-gray-500 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
            What changed, when, and why. For humans.
          </p>
        </div>

        <div className="flex flex-col gap-12">
          {entries.map(entry => (
            <div key={entry.version}>
              {/* Version header */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-xs font-black px-3 py-1.5 rounded-lg" style={{ background: '#1C2B3A', color: '#F5B800', fontFamily: "'JetBrains Mono', monospace" }}>
                  {entry.version}
                </span>
                <div>
                  <p className="font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>{entry.title}</p>
                  <p className="text-xs text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{entry.date}</p>
                </div>
              </div>

              {/* Changes */}
              <div className="flex flex-col gap-3 pl-4" style={{ borderLeft: '2px solid rgba(0,0,0,0.07)' }}>
                {entry.changes.map((change, i) => {
                  const meta = TYPE_META[change.type] ?? TYPE_META.polish
                  return (
                    <div key={i} className="rounded-xl bg-white px-5 py-4" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
                      <div className="flex items-start gap-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 mt-0.5" style={{ background: meta.bg, color: meta.color, fontFamily: "'JetBrains Mono', monospace" }}>
                          {meta.label}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-[#1C2B3A] mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                            {change.summary}
                          </p>
                          <p className="text-xs leading-relaxed text-gray-500" style={{ fontFamily: "'Inter', sans-serif" }}>
                            {change.detail}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8" style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }}>
          <p className="text-xs text-gray-400 text-center" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            © {new Date().getFullYear()} Hare House Consulting Ltd
          </p>
        </div>
      </div>
    </div>
  )
}
