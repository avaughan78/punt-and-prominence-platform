import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const role = user.user_metadata?.role
  const field = role === 'business' ? 'business_id' : 'creator_id'

  const { data: match } = await supabase
    .from('matches')
    .select('id')
    .eq('id', id)
    .eq(field, user.id)
    .single()
  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })

  const { data, error } = await supabase
    .from('match_deliverables')
    .select('*')
    .eq('match_id', id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.user_metadata?.role !== 'creator') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { month_number, post_url } = await req.json() as { month_number?: number; post_url: string }

  if (!post_url) return NextResponse.json({ error: 'post_url required' }, { status: 400 })

  const { data: match } = await supabase
    .from('matches')
    .select('id, status, invite:offers(invite_type), business:profiles!matches_business_id_fkey(display_name, business_name, email), invite_title:offers(title)')
    .eq('id', id)
    .eq('creator_id', user.id)
    .single()

  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })

  const invite = match.invite as unknown as { invite_type: string } | null
  const isRetainer = invite?.invite_type === 'retainer'

  if (isRetainer && match.status !== 'active') {
    return NextResponse.json({ error: 'Match is not active' }, { status: 400 })
  }
  if (!isRetainer && !['accepted', 'posted'].includes(match.status)) {
    return NextResponse.json({ error: 'Cannot submit posts for this match' }, { status: 400 })
  }
  if (isRetainer && !month_number) {
    return NextResponse.json({ error: 'month_number required for retainer posts' }, { status: 400 })
  }

  if (isRetainer && month_number) {
    const { data: existing } = await supabase
      .from('match_deliverables')
      .select('id')
      .eq('match_id', id)
      .eq('month_number', month_number)
      .single()
    if (existing) return NextResponse.json({ error: 'Post already submitted for this month' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('match_deliverables')
    .insert({ match_id: id, month_number: month_number ?? null, post_url })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Auto-advance one-off match from accepted → posted on first submission
  if (!isRetainer && match.status === 'accepted') {
    await supabase
      .from('matches')
      .update({ status: 'posted' })
      .eq('id', id)
  }

  return NextResponse.json({ deliverable: data, matchStatus: !isRetainer && match.status === 'accepted' ? 'posted' : match.status }, { status: 201 })
}
