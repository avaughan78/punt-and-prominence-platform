import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const FROM = 'Punt & Prominence <hello@puntandprominence.co.uk>'
const APP_URL = process.env.APP_URL ?? 'https://puntandprominence.co.uk'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: creatorId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.user_metadata?.role !== 'business') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Get business profile
  const { data: biz } = await supabase
    .from('profiles')
    .select('business_name, display_name')
    .eq('id', user.id)
    .single()

  // Get creator profile
  const { data: creator } = await supabase
    .from('profiles')
    .select('display_name, email, instagram_handle')
    .eq('id', creatorId)
    .eq('role', 'creator')
    .single()

  if (!creator?.email) return NextResponse.json({ error: 'Creator not found' }, { status: 404 })

  // Check business has at least one active invite
  const { data: invites } = await supabase
    .from('offers')
    .select('id, title')
    .eq('business_id', user.id)
    .eq('is_active', true)
    .limit(3)

  if (!invites?.length) {
    return NextResponse.json({ error: 'You need an active invite before you can nudge creators.' }, { status: 400 })
  }

  // One nudge per business-creator pair
  const { data: existing } = await supabase
    .from('nudges')
    .select('business_id')
    .eq('business_id', user.id)
    .eq('creator_id', creatorId)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'You have already nudged this creator.' }, { status: 409 })
  }

  const bizName = biz?.business_name ?? biz?.display_name ?? 'A business'
  const creatorFirstName = creator.display_name.split(' ')[0]
  const inviteList = invites.map(i => `<li style="margin-bottom:6px;">${i.title}</li>`).join('')

  // Record nudge before sending so a failed email doesn't allow a retry loop
  await supabase.from('nudges').insert({ business_id: user.id, creator_id: creatorId })

  if (resend) {
    await resend.emails.send({
      from: FROM,
      to: creator.email,
      subject: `${bizName} wants to work with you`,
      html: `
        <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1C2B3A;">
          <div style="margin-bottom:24px;">
            <span style="font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;color:#F5B800;">★ PUNT & PROMINENCE</span>
          </div>
          <h2 style="font-size:20px;font-weight:700;margin:0 0 8px;">Hi ${creatorFirstName} 👋</h2>
          <p style="color:#6b7280;margin:0 0 16px;"><strong>${bizName}</strong> has spotted your profile on Punt & Prominence and thinks you'd be a great fit for their current invites.</p>
          <p style="color:#6b7280;margin:0 0 8px;font-weight:600;">Their open invites:</p>
          <ul style="color:#6b7280;margin:0 0 24px;padding-left:20px;line-height:1.8;">${inviteList}</ul>
          <a href="${APP_URL}/creator/browse" style="display:inline-block;background:#1C2B3A;color:#F5B800;font-weight:700;padding:12px 24px;border-radius:10px;text-decoration:none;font-family:'JetBrains Mono',monospace;">Browse & claim →</a>
          <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;">
            Cambridge's local creator marketplace · <a href="mailto:hello@puntandprominence.co.uk" style="color:#9ca3af;">hello@puntandprominence.co.uk</a>
          </div>
        </div>
      `,
    }).catch(console.error)
  }

  return NextResponse.json({ ok: true })
}
