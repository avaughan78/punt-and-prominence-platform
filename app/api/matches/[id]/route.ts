import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const role = user.user_metadata?.role

  // Enforce who can update what
  const allowedUpdates: Record<string, string[]> = {
    business: ['status'],   // business marks visited / verified
    creator: ['status', 'post_url'],  // creator marks posted + adds URL
  }
  const allowed = allowedUpdates[role] ?? []
  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }

  // Status transition validation
  const validTransitions: Record<string, Record<string, string[]>> = {
    business: { pending: ['visited'], posted: ['verified'] },
    creator: { visited: ['posted'] },
  }
  if (update.status) {
    const { data: match } = await supabase.from('matches').select('status').eq('id', id).single()
    const allowed_next = validTransitions[role]?.[match?.status ?? ''] ?? []
    if (!allowed_next.includes(update.status as string)) {
      return NextResponse.json({ error: `Cannot transition from ${match?.status} to ${update.status}` }, { status: 400 })
    }
  }

  const field = role === 'business' ? 'business_id' : 'creator_id'
  const { data, error } = await supabase
    .from('matches')
    .update(update)
    .eq('id', id)
    .eq(field, user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
