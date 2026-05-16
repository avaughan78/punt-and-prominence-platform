import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import {
  emailMatchClaimed,
  emailMatchVisited,
  emailMatchPosted,
  emailMatchVerified,
  emailWelcomeBusiness,
  emailWelcomeCreator,
  emailCreatorApproved,
  emailCreatorRejected,
  emailPasswordReset,
  emailWaitlistConfirmation,
} from '@/lib/email'

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const to = user.email!
  const APP_URL = process.env.APP_URL ?? 'https://puntandprominence.co.uk'

  const emails: Array<{ name: string; fn: () => Promise<void> }> = [
    { name: 'matchClaimed',    fn: () => emailMatchClaimed({ businessEmail: to, businessName: 'The Anchor', creatorName: 'Sophie Williams', offerTitle: 'Dinner for two — content collab', puntCode: 'PNT4K2' }) },
    { name: 'matchVisited',    fn: () => emailMatchVisited({ creatorEmail: to, creatorName: 'Sophie Williams', businessName: 'The Anchor', offerTitle: 'Dinner for two — content collab', puntCode: 'PNT4K2' }) },
    { name: 'matchPosted',     fn: () => emailMatchPosted({ businessEmail: to, businessName: 'The Anchor', creatorName: 'Sophie Williams', offerTitle: 'Dinner for two — content collab', postUrl: 'https://www.instagram.com/p/example123/' }) },
    { name: 'matchVerified',   fn: () => emailMatchVerified({ creatorEmail: to, creatorName: 'Sophie Williams', businessName: 'The Anchor', offerTitle: 'Dinner for two — content collab' }) },
    { name: 'welcomeBusiness', fn: () => emailWelcomeBusiness({ email: to, name: 'The Anchor' }) },
    { name: 'welcomeCreator',  fn: () => emailWelcomeCreator({ email: to, name: 'Sophie' }) },
    { name: 'creatorApproved', fn: () => emailCreatorApproved({ email: to, name: 'Sophie' }) },
    { name: 'creatorRejected', fn: () => emailCreatorRejected({ email: to, name: 'Sophie' }) },
    { name: 'passwordReset',   fn: () => emailPasswordReset({ email: to, resetUrl: `${APP_URL}/reset-password` }) },
    { name: 'waitlist',        fn: () => emailWaitlistConfirmation({ email: to }) },
  ]

  const results: Record<string, string> = {}
  for (const { name, fn } of emails) {
    try {
      await fn()
      results[name] = 'ok'
    } catch (err) {
      results[name] = err instanceof Error ? err.message : 'failed'
    }
    await delay(500)
  }

  return NextResponse.json({ to, results })
}
