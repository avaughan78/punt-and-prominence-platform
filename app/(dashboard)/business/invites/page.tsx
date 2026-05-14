import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isBusinessProfileComplete } from '@/lib/profileComplete'
import { CollabsClient } from './CollabsClient'

export default async function BusinessCollabsPage({
  searchParams,
}: {
  searchParams: Promise<{ open?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { open }] = await Promise.all([
    supabase.from('profiles').select('business_name, category, address_line').eq('id', user.id).single(),
    searchParams,
  ])

  return (
    <CollabsClient
      currentUserId={user.id}
      isProfileComplete={isBusinessProfileComplete(profile as Record<string, unknown>)}
      openCollabId={open}
    />
  )
}
