import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isBusinessProfileComplete } from '@/lib/profileComplete'
import { CollabsClient } from './CollabsClient'

export default async function BusinessCollabsPage({
  searchParams,
}: {
  searchParams: Promise<{ open?: string; match?: string; filter?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { open, match, filter }] = await Promise.all([
    supabase.from('profiles').select('business_name, category, address_line').eq('id', user.id).single(),
    searchParams,
  ])

  const validFilters = ['all', 'open', 'closed', 'review'] as const
  type Filter = typeof validFilters[number]
  const initialFilter = validFilters.includes(filter as Filter) ? (filter as Filter) : undefined

  return (
    <CollabsClient
      currentUserId={user.id}
      isProfileComplete={isBusinessProfileComplete(profile as Record<string, unknown>)}
      openCollabId={open}
      openMatchId={match}
      initialFilter={initialFilter}
    />
  )
}
