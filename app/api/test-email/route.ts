import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 500 })

  const resend = new Resend(apiKey)
  const { data, error } = await resend.emails.send({
    from: 'Punt & Prominence <hello@puntandprominence.co.uk>',
    to: user.email!,
    subject: 'Resend test — Punt & Prominence',
    html: '<p>If you can read this, Resend is working correctly.</p>',
  })

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ ok: true, id: data?.id })
}
