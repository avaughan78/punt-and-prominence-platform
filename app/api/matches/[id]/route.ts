import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { emailMatchVerified } from '@/lib/email'
import { stripe } from '@/lib/stripe'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = user.user_metadata?.role
  if (role !== 'business') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const { action } = body as { action?: string }

  if (action !== 'close' && action !== 'reopen') {
    return NextResponse.json({ error: 'action must be close or reopen' }, { status: 400 })
  }

  const { data: match } = await supabase
    .from('matches')
    .select(`
      closed_at, punt_code, stripe_payment_intent_id, payout_status,
      offer:offers(title, value_gbp, compensation_type),
      creator:profiles!matches_creator_id_fkey(id, display_name, email),
      business:profiles!matches_business_id_fkey(id, display_name, business_name)
    `)
    .eq('id', id)
    .eq('business_id', user.id)
    .single()

  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })

  const closed_at = action === 'close' ? new Date().toISOString() : null

  const { data, error } = await supabase
    .from('matches')
    .update({ closed_at })
    .eq('id', id)
    .eq('business_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (action === 'close') {
    const creator = match.creator as unknown as { id: string; display_name: string; email: string } | null
    const business = match.business as unknown as { id: string; display_name: string; business_name: string | null } | null
    const offerRaw = match.offer
    const offer = (Array.isArray(offerRaw) ? offerRaw[0] : offerRaw) as { title: string; value_gbp: number; compensation_type: string } | null

    // Capture held payment and transfer to creator
    if (
      offer?.compensation_type === 'paid' &&
      match.stripe_payment_intent_id &&
      match.payout_status === 'pending'
    ) {
      try {
        await stripe.paymentIntents.capture(match.stripe_payment_intent_id)
        await supabase.from('matches').update({ payout_status: 'paid' }).eq('id', id)
      } catch (err: unknown) {
        const e = err as { message?: string; code?: string }
        console.error('[Stripe] Capture failed on close for match', id, e?.message, e?.code)
        await supabase.from('matches').update({
          notes: `Stripe capture error: ${e?.message ?? 'unknown'} (${e?.code ?? 'no code'})`,
        }).eq('id', id)
      }
    }

    if (creator?.email) {
      emailMatchVerified({
        creatorEmail: creator.email,
        creatorName: creator.display_name,
        businessName: business?.business_name ?? business?.display_name ?? '',
        offerTitle: offer?.title ?? 'Collab',
      })
    }
  }

  return NextResponse.json(data)
}
