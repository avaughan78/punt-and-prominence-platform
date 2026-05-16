import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import {
  emailMatchPosted,
  emailMatchVisited,
  emailMatchVerified,
} from '@/lib/email'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const role = user.user_metadata?.role

  const allowedUpdates: Record<string, string[]> = {
    business: ['status'],
    creator: ['status'],
  }
  const allowed = allowedUpdates[role] ?? []
  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }

  // Status transition validation (one_off and retainer)
  const validTransitions: Record<string, Record<string, string[]>> = {
    business: { accepted: ['active'], posted: ['verified'], verified: ['posted'], active: ['completed'] },
    creator: { accepted: ['posted'], active: ['completed'] },
  }

  const { data: match } = await supabase
    .from('matches')
    .select(`
      status, punt_code, post_url,
      offer:offers(title, value_gbp),
      creator:profiles!matches_creator_id_fkey(id, display_name, email),
      business:profiles!matches_business_id_fkey(id, display_name, business_name, email)
    `)
    .eq('id', id)
    .single()

  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })

  if (update.status) {
    const allowed_next = validTransitions[role]?.[match.status ?? ''] ?? []
    if (!allowed_next.includes(update.status as string)) {
      return NextResponse.json({ error: `Cannot transition from ${match.status} to ${update.status}` }, { status: 400 })
    }
  }

  const field = role === 'business' ? 'business_id' : 'creator_id'
  const { data, error } = await supabase
    .from('matches')
    .update(update)
    .eq('id', id)
    .eq(field, user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Send notifications (fire and forget)
  const creator = match.creator as unknown as { id: string; display_name: string; email: string } | null
  const business = match.business as unknown as { id: string; display_name: string; business_name: string | null; email: string } | null
  const offer = match.offer as unknown as { title: string; value_gbp: number } | null
  const businessName = business?.business_name ?? business?.display_name ?? ''
  const offerTitle = offer?.title ?? 'Offer'

  if (update.status === 'active' && creator?.email) {
    // Business confirmed the visit — notify the creator
    emailMatchVisited({
      creatorEmail: creator.email,
      creatorName: creator.display_name,
      businessName,
      offerTitle,
      puntCode: match.punt_code ?? '',
    })
  } else if (update.status === 'verified' && creator?.email) {
    emailMatchVerified({
      creatorEmail: creator.email,
      creatorName: creator.display_name,
      businessName,
      offerTitle,
    })
  } else if (update.status === 'posted' && business?.email) {
    // Fallback: if status is manually advanced to posted via PATCH,
    // fetch the most recent deliverable URL
    const { data: latestDeliverable } = await supabase
      .from('match_deliverables')
      .select('post_url')
      .eq('match_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    emailMatchPosted({
      businessEmail: business.email,
      businessName,
      creatorName: creator?.display_name ?? '',
      offerTitle,
      postUrl: latestDeliverable?.post_url ?? match.post_url ?? '',
    })
  }

  return NextResponse.json(data)
}
