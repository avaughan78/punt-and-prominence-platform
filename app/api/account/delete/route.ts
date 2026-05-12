import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE() {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // matches.business_id → profiles has NO ACTION, so must delete those matches first.
  // matches.creator_id → profiles has CASCADE, so profile delete handles the creator side.
  await admin.from('matches').delete().eq('business_id', user.id)

  // Deleting the profile cascades to: offers (business), matches via creator_id (creator)
  await admin.from('profiles').delete().eq('id', user.id)

  // Finally remove the auth user
  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
