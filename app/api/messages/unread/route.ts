import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ posts: 0, messages: 0 })

  const role = user.user_metadata?.role

  // ── Posts to review (business only) ───────────────────────────────────────
  // Count unverified deliverables on non-closed matches
  let posts = 0
  let postsDetail: { creatorHandle: string | null; creatorName: string; offerTitle: string }[] = []
  if (role === 'business') {
    const { data: openMatches } = await supabase
      .from('matches')
      .select('id, deliverables:match_deliverables(id, verified_at), creator:profiles!matches_creator_id_fkey(display_name, instagram_handle), offer:offers(title)')
      .eq('business_id', user.id)
      .is('closed_at', null)

    const matchesWithUnverified = (openMatches ?? []).filter(m =>
      (m.deliverables as { id: string; verified_at: string | null }[]).some(d => !d.verified_at)
    )

    posts = matchesWithUnverified.reduce((sum, m) => {
      const delivs = m.deliverables as { id: string; verified_at: string | null }[]
      return sum + delivs.filter(d => !d.verified_at).length
    }, 0)

    postsDetail = matchesWithUnverified.map(m => {
      const c = m.creator as unknown as { display_name: string; instagram_handle: string | null } | null
      const o = m.offer as unknown as { title: string } | null
      return { creatorHandle: c?.instagram_handle ?? null, creatorName: c?.display_name ?? 'Creator', offerTitle: o?.title ?? 'Collab' }
    })
  }

  // ── Unread messages (both roles) ───────────────────────────────────────────
  const field = role === 'business' ? 'business_id' : 'creator_id'

  const { data: userMatches } = await supabase
    .from('matches')
    .select('id')
    .eq(field, user.id)

  const matchIds = (userMatches ?? []).map(m => m.id)

  let messages = 0
  let unreadMatchIds: string[] = []
  if (matchIds.length > 0) {
    const [{ data: allMessages }, { data: reads }] = await Promise.all([
      supabase
        .from('match_messages')
        .select('match_id, created_at')
        .in('match_id', matchIds)
        .neq('sender_id', user.id),
      supabase
        .from('match_message_reads')
        .select('match_id, last_read_at')
        .eq('user_id', user.id)
        .in('match_id', matchIds),
    ])

    const readMap = Object.fromEntries((reads ?? []).map(r => [r.match_id, r.last_read_at]))
    const unreadMatchIdSet = new Set<string>()
    ;(allMessages ?? []).forEach(msg => {
      const lastRead = readMap[msg.match_id] ?? '1970-01-01T00:00:00Z'
      if (msg.created_at > lastRead) {
        messages++
        unreadMatchIdSet.add(msg.match_id)
      }
    })
    unreadMatchIds = [...unreadMatchIdSet]
  }

  return NextResponse.json({ posts, messages, unreadMatchIds, postsDetail })
}
