import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BusinessProfilePage } from '@/components/profile/BusinessProfilePage'

export default async function BusinessProfileRoute() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, business_name, bio, instagram_handle, website_url, address_line, category, latitude, longitude, avatar_url, follower_count, tiktok_handle, tiktok_follower_count, media_count')
    .eq('id', user.id)
    .single()

  const p = profile ?? {
    display_name: '', business_name: null, bio: null,
    instagram_handle: null, website_url: null, address_line: null, category: null,
    latitude: null, longitude: null, avatar_url: null, follower_count: null,
    tiktok_handle: null, tiktok_follower_count: null, media_count: null,
  }

  return (
    <BusinessProfilePage
      profile={p}
      userId={user.id}
      isComplete={!!p.business_name}
    />
  )
}
