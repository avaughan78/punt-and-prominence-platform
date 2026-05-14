import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { emailWelcomeBusiness, emailWelcomeCreator } from '@/lib/email'
import { writeAuditLog } from '@/lib/audit'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = user.user_metadata?.role
  const name = user.user_metadata?.display_name ?? 'there'
  const email = user.email!

  if (role === 'business') {
    await emailWelcomeBusiness({ email, name })
    await writeAuditLog({
      event_type: 'business.registered',
      actor: email,
      subject_type: 'business',
      subject_id: user.id,
      metadata: { display_name: name, email },
    })
  } else {
    await emailWelcomeCreator({ email, name })
    await writeAuditLog({
      event_type: 'creator.registered',
      actor: email,
      subject_type: 'creator',
      subject_id: user.id,
      metadata: { display_name: name, email },
    })
  }

  return NextResponse.json({ ok: true })
}
