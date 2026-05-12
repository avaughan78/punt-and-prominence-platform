import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingFlow } from '@/components/business/OnboardingFlow'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, business_name')
    .eq('id', user.id)
    .single()

  // Already onboarded — skip to dashboard
  if (profile?.business_name) redirect('/business')

  return (
    <div className="max-w-2xl mx-auto py-4">
      <OnboardingFlow contactName={profile?.display_name ?? 'there'} />
    </div>
  )
}
