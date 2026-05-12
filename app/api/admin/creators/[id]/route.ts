import { adminGuard } from '@/lib/adminGuard'
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
    .select('display_name, is_approved')
    .eq('id', id)
    .single()

  if (fetchError || !profile) return NextResponse.json({ error: 'Creator not found' }, { status: 404 })

  const { data: authUser } = await supabase.auth.admin.getUserById(id)
  const email = authUser?.user?.email

  if (action === 'approve') {
    await supabase.from('profiles').update({ is_approved: true }).eq('id', id)
    if (email) await emailCreatorApproved({ email, name: profile.display_name })

  } else if (action === 'reject') {
    // Send rejection email first, then delete the user entirely (cascades to profile)
    if (email) await emailCreatorRejected({ email, name: profile.display_name, reason })
    await supabase.auth.admin.deleteUser(id)

  } else if (action === 'revoke') {
    // Remove access but keep the account
    await supabase.from('profiles').update({ is_approved: false }).eq('id', id)

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
  await supabase.auth.admin.deleteUser(id)
  return NextResponse.json({ ok: true })
}
