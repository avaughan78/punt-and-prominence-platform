import { adminGuard } from '@/lib/adminGuard'
import { writeAuditLog } from '@/lib/audit'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await adminGuard()
  if ('error' in guard) return guard.error
  const { supabase } = guard

  const { id } = await params
  const body = await req.json()

  if (!('closed_at' in body)) {
    return NextResponse.json({ error: 'Only closed_at can be updated via this endpoint' }, { status: 400 })
  }

  const closed_at: string | null = body.closed_at === null ? null : new Date().toISOString()

  const { data: match } = await supabase
    .from('matches')
    .select('closed_at, punt_code, creator:profiles!matches_creator_id_fkey(display_name, instagram_handle), business:profiles!matches_business_id_fkey(business_name, display_name), offer:offers(title)')
    .eq('id', id)
    .single()

  const { error } = await supabase.from('matches').update({ closed_at }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const authClient = await createClient()
  const { data: { user: adminUser } } = await authClient.auth.getUser()

  const creator  = match?.creator  as { display_name?: string; instagram_handle?: string } | null
  const business = match?.business as { business_name?: string; display_name?: string }    | null
  const offer    = match?.offer    as { title?: string }                                   | null

  await writeAuditLog({
    event_type: closed_at ? 'match.closed' : 'match.reopened',
    actor: adminUser?.email ?? 'admin',
    subject_type: 'match',
    subject_id: id,
    metadata: {
      punt_code:     match?.punt_code,
      was_closed:    !!match?.closed_at,
      now_closed:    !!closed_at,
      creator_name:  creator?.instagram_handle ? `@${creator.instagram_handle}` : creator?.display_name,
      business_name: business?.business_name ?? business?.display_name,
      offer_title:   offer?.title,
    },
  })

  return NextResponse.json({ ok: true })
}
