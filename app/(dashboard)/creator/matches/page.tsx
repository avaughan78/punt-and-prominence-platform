import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CreatorMatchesClient } from './CreatorMatchesClient'

export default async function CreatorMatchesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return <CreatorMatchesClient currentUserId={user.id} />
}
