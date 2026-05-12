import { adminGuard } from '@/lib/adminGuard'
import { NextResponse } from 'next/server'
import { emailCreatorApproved, emailCreatorRejected } from '@/lib/email'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await adminGuard()
  if ('error' in guard) return guard.error
  const { supabase } = guard

  const { id } = await params
  const { action, reason } = await request.json() as { action: 'approve' | 'reject'; reason?: string }

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
    await supabase.from('profiles').update({ is_approved: false }).eq('id', id)
    if (email) await emailCreatorRejected({ email, name: profile.display_name, reason })
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
