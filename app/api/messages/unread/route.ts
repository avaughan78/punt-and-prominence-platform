import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ posts: 0, messages: 0 })

  const role = user.user_metadata?.role

  // ── Posts to review (business only) ───────────────────────────────────────
  let posts = 0
  if (role === 'business') {
    const { count } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', user.id)
      .eq('status', 'posted')
    posts = count ?? 0
  }

  // ── Unread messages (both roles) ───────────────────────────────────────────
  const field = role === 'business' ? 'business_id' : 'creator_id'

  const { data: userMatches } = await supabase
    .from('matches')
    .select('id')
    .eq(field, user.id)

  const matchIds = (userMatches ?? []).map(m => m.id)

  let messages = 0
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
    messages = (allMessages ?? []).filter(msg => {
      const lastRead = readMap[msg.match_id] ?? '1970-01-01T00:00:00Z'
      return msg.created_at > lastRead
    }).length
  }

  return NextResponse.json({ posts, messages })
}
