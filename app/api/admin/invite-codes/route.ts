import { adminGuard } from '@/lib/adminGuard'
import { NextResponse } from 'next/server'

export async function GET() {
  const guard = await adminGuard()
  if ('error' in guard) return guard.error
  const { supabase } = guard

  const { data } = await supabase
    .from('invite_codes')
    .select('id, code, used, used_by, created_at, reusable')
    .order('created_at', { ascending: false })

  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const guard = await adminGuard()
  if ('error' in guard) return guard.error
  const { supabase } = guard

  const { code, reusable = false } = await request.json() as { code: string; reusable?: boolean }
  if (!code?.trim()) return NextResponse.json({ error: 'Code required' }, { status: 400 })

  const { data, error } = await supabase
    .from('invite_codes')
    .insert({ code: code.trim().toUpperCase(), reusable })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
