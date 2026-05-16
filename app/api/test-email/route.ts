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

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const to = user.email!
  const APP_URL = process.env.APP_URL ?? 'https://puntandprominence.co.uk'

  await Promise.all([
    emailMatchClaimed({
      businessEmail: to,
      businessName: 'The Anchor',
      creatorName: 'Sophie Williams',
      offerTitle: 'Dinner for two — content collab',
      puntCode: 'PNT4K2',
    }),
    emailMatchVisited({
      creatorEmail: to,
      creatorName: 'Sophie Williams',
      businessName: 'The Anchor',
      offerTitle: 'Dinner for two — content collab',
      puntCode: 'PNT4K2',
    }),
    emailMatchPosted({
      businessEmail: to,
      businessName: 'The Anchor',
      creatorName: 'Sophie Williams',
      offerTitle: 'Dinner for two — content collab',
      postUrl: 'https://www.instagram.com/p/example123/',
    }),
    emailMatchVerified({
      creatorEmail: to,
      creatorName: 'Sophie Williams',
      businessName: 'The Anchor',
      offerTitle: 'Dinner for two — content collab',
    }),
    emailWelcomeBusiness({ email: to, name: 'The Anchor' }),
    emailWelcomeCreator({ email: to, name: 'Sophie' }),
    emailCreatorApproved({ email: to, name: 'Sophie' }),
    emailCreatorRejected({ email: to, name: 'Sophie' }),
    emailPasswordReset({ email: to, resetUrl: `${APP_URL}/reset-password` }),
    emailWaitlistConfirmation({ email: to }),
  ])

  return NextResponse.json({ ok: true, sent: 10, to })
}
