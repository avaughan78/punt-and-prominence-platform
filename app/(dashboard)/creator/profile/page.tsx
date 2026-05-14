import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CreatorProfilePage } from '@/components/profile/CreatorProfilePage'

export default async function CreatorProfileRoute() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, business_name, bio, instagram_handle, website_url, address_line, category, latitude, longitude, avatar_url, follower_count, tiktok_handle, tiktok_follower_count, is_approved')
    .eq('id', user.id)
    .single()

  const p = profile ?? {
    display_name: '', business_name: null, bio: null,
    instagram_handle: null, website_url: null, address_line: null, category: null,
    latitude: null, longitude: null, avatar_url: null, follower_count: null,
    tiktok_handle: null, tiktok_follower_count: null,
  }

  return (
    <CreatorProfilePage
      profile={p}
      userId={user.id}
      isComplete={!!p.instagram_handle}
      isApproved={profile?.is_approved ?? false}
    />
  )
}
