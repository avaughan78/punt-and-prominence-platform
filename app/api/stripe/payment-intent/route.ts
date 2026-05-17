import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

// Creates and holds a PaymentIntent when a creator claims a paid collab
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { match_id } = await req.json()
  if (!match_id) return NextResponse.json({ error: 'Missing match_id' }, { status: 400 })

  // Load match + offer + business profile
  const { data: match } = await supabase
    .from('matches')
    .select('id, business_id, offer_id, stripe_payment_intent_id, offers(value_gbp, compensation_type, title)')
    .eq('id', match_id)
    .single()

  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  if (match.stripe_payment_intent_id) return NextResponse.json({ error: 'Payment already created' }, { status: 409 })

  const offer = (Array.isArray(match.offers) ? match.offers[0] : match.offers) as { value_gbp: number; compensation_type: string; title: string } | null
  if (!offer || offer.compensation_type !== 'paid') {
    return NextResponse.json({ error: 'Not a paid collab' }, { status: 400 })
  }

  // Load business Stripe customer + payment method
  const { data: biz } = await supabase
    .from('profiles')
    .select('stripe_customer_id, stripe_payment_method_id')
    .eq('id', match.business_id)
    .single()

  if (!biz?.stripe_customer_id || !biz?.stripe_payment_method_id) {
    return NextResponse.json({ error: 'Business has no payment method on file' }, { status: 402 })
  }

  // Load creator Stripe account
  const { data: creator } = await supabase
    .from('profiles')
    .select('stripe_account_id, stripe_onboarding_complete')
    .eq('id', user.id)
    .single()

  if (!creator?.stripe_account_id || !creator?.stripe_onboarding_complete) {
    return NextResponse.json({ error: 'Creator has not completed Stripe onboarding' }, { status: 402 })
  }

  const amountPence = Math.round(offer.value_gbp * 100)

  const intent = await stripe.paymentIntents.create({
    amount: amountPence,
    currency: 'gbp',
    customer: biz.stripe_customer_id,
    payment_method: biz.stripe_payment_method_id,
    capture_method: 'manual', // hold funds, don't charge yet
    confirm: true,
    description: `Punt & Prominence — ${offer.title}`,
    metadata: { match_id, offer_id: match.offer_id },
    transfer_data: { destination: creator.stripe_account_id },
  })

  await supabase
    .from('matches')
    .update({ stripe_payment_intent_id: intent.id, payout_status: 'pending' })
    .eq('id', match_id)

  return NextResponse.json({ success: true })
}
