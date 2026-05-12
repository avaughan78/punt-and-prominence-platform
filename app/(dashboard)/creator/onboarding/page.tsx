import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CreatorOnboardingFlow } from '@/components/creator/OnboardingFlow'

export default async function CreatorOnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, instagram_handle, avatar_url')
    .eq('id', user.id)
    .single()

  // Already onboarded — skip to browse
  if (profile?.instagram_handle) redirect('/creator/browse')

  return (
    <div className="max-w-2xl mx-auto py-4">
      <CreatorOnboardingFlow
        userId={user.id}
        contactName={profile?.display_name ?? 'there'}
        initialAvatarUrl={profile?.avatar_url ?? null}
      />
    </div>
  )
}
