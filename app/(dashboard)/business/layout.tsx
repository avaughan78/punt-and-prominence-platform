import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/layout/DashboardShell'

export default async function BusinessLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, business_name, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'business') redirect('/creator')

  return (
    <DashboardShell role="business" displayName={profile.business_name ?? profile.display_name}>
      {children}
    </DashboardShell>
  )
}
