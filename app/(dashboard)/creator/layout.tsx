import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/layout/DashboardShell'

export default async function CreatorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/creator/onboarding')
  if (profile.role !== 'creator') redirect('/business')

  return (
    <DashboardShell role="creator" displayName={profile.display_name}>
      {children}
    </DashboardShell>
  )
}
