import { adminGuard } from '@/lib/adminGuard'
import { writeAuditLog } from '@/lib/audit'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await adminGuard()
  if ('error' in guard) return guard.error
  const { supabase } = guard

  const { id } = await params
  const { action } = await req.json() as { action: 'suspend' | 'unsuspend' }

  if (action !== 'suspend' && action !== 'unsuspend') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const suspended = action === 'suspend'

  const authClient = await createClient()
  const { data: { user: adminUser } } = await authClient.auth.getUser()
  const actor = adminUser?.email ?? 'admin'

  const { data: profile } = await supabase
    .from('profiles')
    .select('business_name, display_name')
    .eq('id', id)
    .single()

  await supabase.from('profiles').update({ is_suspended: suspended }).eq('id', id)

  if (suspended) {
    await supabase.from('offers').update({ is_active: false }).eq('business_id', id)
  }

  await writeAuditLog({
    event_type: suspended ? 'business.suspended' : 'business.unsuspended',
    actor,
    subject_type: 'business',
    subject_id: id,
    metadata: {
      business_name: profile?.business_name ?? profile?.display_name,
    },
  })

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

  // Snapshot before deletion
  const { data: profile } = await supabase
    .from('profiles')
    .select('business_name, display_name, category, address_line, instagram_handle, website_url, created_at')
    .eq('id', id)
    .single()

  const { data: offers } = await supabase
    .from('offers')
    .select('id, title, invite_type, is_active, created_at')
    .eq('business_id', id)

  const { data: matches } = await supabase
    .from('matches')
    .select('id, status, created_at, profiles!matches_creator_id_fkey(display_name, instagram_handle)')
    .eq('business_id', id)

  await writeAuditLog({
    event_type: 'business.deleted',
    actor,
    subject_type: 'business',
    subject_id: id,
    metadata: {
      profile,
      offers: offers ?? [],
      matches: matches ?? [],
    },
  })

  // Delete dependents before auth user (FK constraints)
  await supabase.from('matches').delete().eq('business_id', id)
  await supabase.from('offers').delete().eq('business_id', id)

  await supabase.auth.admin.deleteUser(id)

  return NextResponse.json({ ok: true })
}
