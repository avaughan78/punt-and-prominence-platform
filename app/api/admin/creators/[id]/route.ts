import { adminGuard } from '@/lib/adminGuard'
import { writeAuditLog } from '@/lib/audit'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { emailCreatorApproved, emailCreatorRejected } from '@/lib/email'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await adminGuard()
  if ('error' in guard) return guard.error
  const { supabase } = guard

  const { id } = await params
  const { action, reason } = await request.json() as { action: 'approve' | 'reject' | 'revoke'; reason?: string }

  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('display_name, is_approved, instagram_handle, follower_count')
    .eq('id', id)
    .single()

  if (fetchError || !profile) return NextResponse.json({ error: 'Creator not found' }, { status: 404 })

  const { data: authUser } = await supabase.auth.admin.getUserById(id)
  const email = authUser?.user?.email

  const authClient = await createClient()
  const { data: { user: adminUser } } = await authClient.auth.getUser()
  const actor = adminUser?.email ?? 'admin'

  if (action === 'approve') {
    await supabase.from('profiles').update({ is_approved: true }).eq('id', id)
    if (email) await emailCreatorApproved({ email, name: profile.display_name })
    await writeAuditLog({
      event_type: 'creator.approved',
      actor,
      subject_type: 'creator',
      subject_id: id,
      metadata: { display_name: profile.display_name, email, instagram_handle: profile.instagram_handle },
    })

  } else if (action === 'reject') {
    if (email) await emailCreatorRejected({ email, name: profile.display_name, reason })
    await writeAuditLog({
      event_type: 'creator.rejected',
      actor,
      subject_type: 'creator',
      subject_id: id,
      metadata: { display_name: profile.display_name, email, instagram_handle: profile.instagram_handle, reason },
    })
    await supabase.auth.admin.deleteUser(id)

  } else if (action === 'revoke') {
    await supabase.from('profiles').update({ is_approved: false }).eq('id', id)
    await writeAuditLog({
      event_type: 'creator.revoked',
      actor,
      subject_type: 'creator',
      subject_id: id,
      metadata: { display_name: profile.display_name, email, instagram_handle: profile.instagram_handle, reason },
    })

  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await adminGuard()
  if ('error' in guard) return guard.error
  const { supabase } = guard

  const { id } = await params

  const authClient = await createClient()
  const { data: { user: adminUser } } = await authClient.auth.getUser()
  const actor = adminUser?.email ?? 'admin'

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, instagram_handle, follower_count, bio, created_at')
    .eq('id', id)
    .single()

  const { data: authUser } = await supabase.auth.admin.getUserById(id)
  const email = authUser?.user?.email

  const { data: matches } = await supabase
    .from('matches')
    .select('id, status, created_at, profiles!matches_business_id_fkey(business_name, display_name)')
    .eq('creator_id', id)

  await writeAuditLog({
    event_type: 'creator.deleted',
    actor,
    subject_type: 'creator',
    subject_id: id,
    metadata: {
      profile,
      email,
      matches: matches ?? [],
    },
  })

  // Delete matches before auth user (FK constraints)
  await supabase.from('matches').delete().eq('creator_id', id)

  await supabase.auth.admin.deleteUser(id)
  return NextResponse.json({ ok: true })
}
