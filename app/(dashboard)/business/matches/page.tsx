import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BusinessMatchesClient } from './BusinessMatchesClient'

export default async function BusinessMatchesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return <BusinessMatchesClient currentUserId={user.id} />
}
