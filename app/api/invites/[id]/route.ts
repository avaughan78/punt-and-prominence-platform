import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { writeAuditLog } from '@/lib/audit'
import { stripe } from '@/lib/stripe'

const EDITABLE = ['title', 'description', 'requirements', 'value_gbp', 'fee_gbp', 'slots_total', 'expires_at', 'posts_per_month', 'duration_months']

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  // Toggle-only (open/close collab) — fast path, cascades closed_at to matches
  if (Object.keys(body).length === 1 && 'is_active' in body) {
    const { data, error } = await supabase
      .from('offers')
      .update({ is_active: body.is_active })
      .eq('id', id)
      .eq('business_id', user.id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Cascade: closing the collab closes all its matches; reopening clears that
    const admin = createAdminClient()
    await admin
      .from('matches')
      .update({ closed_at: body.is_active ? null : new Date().toISOString() })
      .eq('offer_id', id)

    // On close: capture held Stripe payments for any paid matches
    if (!body.is_active && data.compensation_type === 'paid') {
      const { data: pendingMatches } = await admin
        .from('matches')
        .select('id, stripe_payment_intent_id')
        .eq('offer_id', id)
        .eq('payout_status', 'pending')
        .not('stripe_payment_intent_id', 'is', null)

      if (pendingMatches && pendingMatches.length > 0) {
        await Promise.allSettled(
          pendingMatches.map(async (m) => {
            try {
              await stripe.paymentIntents.capture(m.stripe_payment_intent_id as string)
              await admin.from('matches').update({ payout_status: 'paid' }).eq('id', m.id)
            } catch (err: unknown) {
              const e = err as { message?: string; code?: string }
              console.error('[Stripe] Capture failed for match', m.id, e?.message, e?.code)
              await admin.from('matches').update({
                notes: `Stripe capture error: ${e?.message ?? 'unknown'} (${e?.code ?? 'no code'})`,
              }).eq('id', m.id)
            }
          })
        )
      }
    }

    return NextResponse.json(data)
  }

  // Full edit — whitelist fields, validate, fan out
  const update: Record<string, unknown> = {}
  for (const key of EDITABLE) {
    if (key in body) update[key] = body[key]
  }

  // Fetch current offer for validation + diffing
  const { data: current } = await supabase
    .from('offers')
    .select('title, description, requirements, value_gbp, fee_gbp, slots_total, slots_claimed, expires_at, posts_per_month, duration_months')
    .eq('id', id)
    .eq('business_id', user.id)
    .single()
  if (!current) return NextResponse.json({ error: 'Collab not found' }, { status: 404 })

  if (update.slots_total != null && Number(update.slots_total) < (current.slots_claimed ?? 0)) {
    return NextResponse.json(
      { error: `Cannot reduce slots below ${current.slots_claimed} — already claimed by ${current.slots_claimed} creator${current.slots_claimed !== 1 ? 's' : ''}` },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('offers')
    .update(update)
    .eq('id', id)
    .eq('business_id', user.id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Build human-readable change list for notifications + audit
  const changes: string[] = []
  if ('title' in update && update.title !== current.title) changes.push(`Title: "${update.title}"`)
  if ('value_gbp' in update && update.value_gbp !== current.value_gbp) changes.push(`Value: £${current.value_gbp} → £${update.value_gbp}`)
  if ('fee_gbp' in update && update.fee_gbp !== current.fee_gbp) changes.push(`Monthly fee: £${current.fee_gbp} → £${update.fee_gbp}`)
  if ('slots_total' in update && update.slots_total !== current.slots_total) changes.push(`Slots: ${current.slots_total} → ${update.slots_total}`)
  if ('posts_per_month' in update && update.posts_per_month !== current.posts_per_month) changes.push(`Posts/month: ${current.posts_per_month} → ${update.posts_per_month}`)
  if ('description' in update && update.description !== current.description) changes.push('Description updated')
  if ('requirements' in update && update.requirements !== current.requirements) changes.push('Requirements updated')
  if ('expires_at' in update && update.expires_at !== current.expires_at) changes.push('Expiry updated')
  if ('duration_months' in update && update.duration_months !== current.duration_months) changes.push('Duration updated')

  // Fan out system message to all active matches on this offer
  if (changes.length > 0) {
    const { data: activeMatches } = await supabase
      .from('matches')
      .select('id')
      .eq('offer_id', id)
      .is('closed_at', null)

    if (activeMatches && activeMatches.length > 0) {
      const admin = createAdminClient()
      const content = `This collab was updated by the business: ${changes.join(' · ')}`
      await Promise.all(
        activeMatches.map(m =>
          admin.from('match_messages').insert({ match_id: m.id, sender_id: user.id, content })
        )
      )
    }

    await writeAuditLog({
      event_type: 'invite.updated',
      actor: user.email ?? user.id,
      subject_type: 'invite',
      subject_id: id,
      metadata: { title: data.title, changes },
    })
  }

  return NextResponse.json(data)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { error } = await supabase
    .from('offers')
    .delete()
    .eq('id', id)
    .eq('business_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new Response(null, { status: 204 })
}
