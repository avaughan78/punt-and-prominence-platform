import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/profile/ProfileForm'

export default async function CreatorProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, business_name, bio, instagram_handle, website_url, address_line, category, latitude, longitude, avatar_url, follower_count')
    .eq('id', user.id)
    .single()

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Businesses see this when you claim their offers.</p>
      </div>
      <ProfileForm role="creator" userId={user.id} initial={profile ?? {
        display_name: '', business_name: null, bio: null,
        instagram_handle: null, website_url: null, address_line: null, category: null,
        latitude: null, longitude: null, avatar_url: null, follower_count: null,
      }} />
    </div>
  )
}
