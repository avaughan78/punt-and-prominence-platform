import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { emailMatchPosted } from '@/lib/email'

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
    .select('id, closed_at, invite:offers(invite_type), business:profiles!matches_business_id_fkey(display_name, business_name, email), invite_title:offers(title)')
    .eq('id', id)
    .eq('creator_id', user.id)
    .single()

  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  if (match.closed_at) return NextResponse.json({ error: 'This collab has been closed' }, { status: 400 })

  const invite = match.invite as unknown as { invite_type: string } | null
  const isRetainer = invite?.invite_type === 'retainer'

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

  const business = match.business as unknown as { display_name: string; business_name: string | null; email: string } | null
  const inviteTitle = match.invite_title as unknown as { title: string } | null

  if (business?.email) {
    emailMatchPosted({
      businessEmail: business.email,
      businessName: business.business_name ?? business.display_name,
      creatorName: user.user_metadata?.display_name ?? 'A creator',
      offerTitle: isRetainer && month_number
        ? `${inviteTitle?.title ?? 'Collab'} — Month ${month_number}`
        : inviteTitle?.title ?? 'Collab',
      postUrl: post_url,
    })
  }

  return NextResponse.json(data, { status: 201 })
}
