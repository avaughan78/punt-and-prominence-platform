import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CreatorMatchesClient } from './CreatorMatchesClient'

export default async function CreatorMatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { filter } = await searchParams
  const validFilters = ['all', 'todo', 'submitted', 'done', 'one_off', 'retainer', 'unread'] as const
  type Filter = typeof validFilters[number]
  const initialFilter = validFilters.includes(filter as Filter) ? (filter as Filter) : undefined

  return <CreatorMatchesClient currentUserId={user.id} initialFilter={initialFilter} />
}
