import { adminGuard } from '@/lib/adminGuard'
import { NextResponse } from 'next/server'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await adminGuard()
  if ('error' in guard) return guard.error
  const { supabase } = guard

  const { id } = await params
  await supabase.from('profiles').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
