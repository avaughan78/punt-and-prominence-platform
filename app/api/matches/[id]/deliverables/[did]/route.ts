import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; did: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, did } = await params
  if (user.user_metadata?.role !== 'creator') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: match } = await supabase
    .from('matches')
    .select('id')
    .eq('id', id)
    .eq('creator_id', user.id)
    .single()
  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })

  const { data: existing } = await supabase
    .from('match_deliverables')
    .select('status')
    .eq('id', did)
    .eq('match_id', id)
    .single()
  if (!existing) return NextResponse.json({ error: 'Deliverable not found' }, { status: 404 })
  if (existing.status === 'verified') return NextResponse.json({ error: 'Cannot delete a verified deliverable' }, { status: 400 })

  const { error } = await supabase
    .from('match_deliverables')
    .delete()
    .eq('id', did)
    .eq('match_id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return new Response(null, { status: 204 })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; did: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, did } = await params
  const role = user.user_metadata?.role
  const body = await req.json().catch(() => ({}))

  if (role === 'creator') {
    // Creator can update post_url on unverified deliverables they own
    const { data: match } = await supabase
      .from('matches')
      .select('id')
      .eq('id', id)
      .eq('creator_id', user.id)
      .single()
    if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })

    const { data: existing } = await supabase
      .from('match_deliverables')
      .select('status')
      .eq('id', did)
      .eq('match_id', id)
      .single()
    if (!existing) return NextResponse.json({ error: 'Deliverable not found' }, { status: 404 })
    if (existing.status === 'verified') return NextResponse.json({ error: 'Cannot edit a verified deliverable' }, { status: 400 })

    if (!body.post_url) return NextResponse.json({ error: 'post_url required' }, { status: 400 })

    const { data, error } = await supabase
      .from('match_deliverables')
      .update({ post_url: body.post_url })
      .eq('id', did)
      .eq('match_id', id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  if (role === 'business') {
    // Business verifies a deliverable
    const { data: match } = await supabase
      .from('matches')
      .select('id, status')
      .eq('id', id)
      .eq('business_id', user.id)
      .single()
    if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })

    const { data, error } = await supabase
      .from('match_deliverables')
      .update({ status: 'verified', verified_at: new Date().toISOString() })
      .eq('id', did)
      .eq('match_id', id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Auto-advance match to verified if all deliverables are now verified
    if (match.status === 'posted') {
      const { data: remaining } = await supabase
        .from('match_deliverables')
        .select('id')
        .eq('match_id', id)
        .neq('status', 'verified')
      if (remaining?.length === 0) {
        await supabase.from('matches').update({ status: 'verified' }).eq('id', id)
      }
    }

    return NextResponse.json(data)
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
