import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createClient()

  switch (event.type) {
    case 'account.updated': {
      const account = event.data.object
      const complete = account.details_submitted && account.capabilities?.transfers === 'active'
      if (complete) {
        await supabase
          .from('profiles')
          .update({ stripe_onboarding_complete: true })
          .eq('stripe_account_id', account.id)
      }
      break
    }

    case 'payment_intent.payment_failed': {
      const intent = event.data.object
      const matchId = intent.metadata?.match_id
      if (matchId) {
        await supabase
          .from('matches')
          .update({ payout_status: 'none', stripe_payment_intent_id: null })
          .eq('id', matchId)
      }
      break
    }

    case 'payment_intent.canceled': {
      const intent = event.data.object
      const matchId = intent.metadata?.match_id
      if (matchId) {
        await supabase
          .from('matches')
          .update({ payout_status: 'refunded' })
          .eq('id', matchId)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
