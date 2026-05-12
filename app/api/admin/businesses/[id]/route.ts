import { adminGuard } from '@/lib/adminGuard'
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

  await supabase.from('profiles').update({ is_suspended: suspended }).eq('id', id)

  // Deactivate all offers when suspending so creators can't claim them
  if (suspended) {
    await supabase.from('offers').update({ is_active: false }).eq('business_id', id)
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await adminGuard()
  if ('error' in guard) return guard.error
  const { supabase } = guard

  const { id } = await params
  await supabase.from('profiles').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
