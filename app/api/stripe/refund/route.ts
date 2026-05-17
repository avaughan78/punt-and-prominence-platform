import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.user_metadata?.role !== 'business') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { match_id } = await req.json()
  if (!match_id) return NextResponse.json({ error: 'Missing match_id' }, { status: 400 })

  const { data: match } = await supabase
    .from('matches')
    .select('id, business_id, stripe_payment_intent_id, payout_status')
    .eq('id', match_id)
    .eq('business_id', user.id)
    .single()

  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  if (match.payout_status !== 'pending') return NextResponse.json({ error: 'Nothing to refund' }, { status: 400 })
  if (!match.stripe_payment_intent_id) return NextResponse.json({ error: 'No payment on file' }, { status: 400 })

  await stripe.paymentIntents.cancel(match.stripe_payment_intent_id)

  await supabase
    .from('matches')
    .update({ payout_status: 'refunded' })
    .eq('id', match_id)

  return NextResponse.json({ success: true })
}
