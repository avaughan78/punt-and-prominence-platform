import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { emailWelcomeBusiness, emailWelcomeCreator } from '@/lib/email'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = user.user_metadata?.role
  const name = user.user_metadata?.display_name ?? 'there'
  const email = user.email!

  if (role === 'business') {
    await emailWelcomeBusiness({ email, name })
  } else {
    await emailWelcomeCreator({ email, name })
  }

  return NextResponse.json({ ok: true })
}
